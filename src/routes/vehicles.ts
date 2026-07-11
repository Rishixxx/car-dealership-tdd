import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validateCreateVehicle, validateUpdateVehicle } from '../validators/vehicle';

const router = Router();

function getDb(req: Request) {
	return req.app.locals.db;
}

function serializeVehicle(vehicle: Record<string, unknown>) {
	return {
		...vehicle,
		price: Number(vehicle.price),
	};
}

router.post('/', authenticate, async (req: Request, res: Response) => {
	const db = getDb(req);
	const errors = validateCreateVehicle(req.body);

	if (errors.length > 0) {
		return res.status(400).json({ error: errors[0].message, details: errors });
	}

	const [id] = await db('vehicles').insert({
		make: req.body.make.trim(),
		model: req.body.model.trim(),
		year: req.body.year,
		category: req.body.category,
		price: req.body.price,
		quantity: req.body.quantity ?? 0,
	});

	const vehicle = await db('vehicles').where({ id }).first();
	return res.status(201).json({ vehicle: serializeVehicle(vehicle) });
});

router.get('/', async (req: Request, res: Response) => {
	const db = getDb(req);
	const vehicles = await db('vehicles').orderBy('id', 'asc');
	return res.status(200).json({ vehicles: vehicles.map(serializeVehicle) });
});

router.get('/search', async (req: Request, res: Response) => {
	const db = getDb(req);
	let query = db('vehicles');

	if (req.query.make) {
		query = query.whereRaw('LOWER(make) LIKE ?', [`%${String(req.query.make).toLowerCase()}%`]);
	}

	if (req.query.model) {
		query = query.whereRaw('LOWER(model) LIKE ?', [`%${String(req.query.model).toLowerCase()}%`]);
	}

	if (req.query.category) {
		query = query.whereRaw('LOWER(category) = ?', [String(req.query.category).toLowerCase()]);
	}

	if (req.query.minPrice !== undefined) {
		query = query.where('price', '>=', Number(req.query.minPrice));
	}

	if (req.query.maxPrice !== undefined) {
		query = query.where('price', '<=', Number(req.query.maxPrice));
	}

	const vehicles = await query.orderBy('id', 'asc');
	return res.status(200).json({ vehicles: vehicles.map(serializeVehicle) });
});

router.put('/:id', authenticate, async (req: Request, res: Response) => {
	const db = getDb(req);
	const vehicleId = Number(req.params.id);
	const errors = validateUpdateVehicle(req.body);

	if (errors.length > 0) {
		return res.status(400).json({ error: errors[0].message, details: errors });
	}

	const existing = await db('vehicles').where({ id: vehicleId }).first();
	if (!existing) {
		return res.status(404).json({ error: 'Vehicle not found' });
	}

	await db('vehicles').where({ id: vehicleId }).update({
		...(req.body.make !== undefined ? { make: req.body.make.trim() } : {}),
		...(req.body.model !== undefined ? { model: req.body.model.trim() } : {}),
		...(req.body.year !== undefined ? { year: req.body.year } : {}),
		...(req.body.category !== undefined ? { category: req.body.category } : {}),
		...(req.body.price !== undefined ? { price: req.body.price } : {}),
		...(req.body.quantity !== undefined ? { quantity: req.body.quantity } : {}),
	});

	const updated = await db('vehicles').where({ id: vehicleId }).first();
	return res.status(200).json({ vehicle: serializeVehicle(updated) });
});

router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
	const db = getDb(req);
	const vehicleId = Number(req.params.id);

	const deleted = await db('vehicles').where({ id: vehicleId }).del();
	if (!deleted) {
		return res.status(404).json({ error: 'Vehicle not found' });
	}

	return res.status(200).json({ message: 'Vehicle deleted successfully' });
});

router.post('/:id/purchase', authenticate, async (req: Request, res: Response) => {
	const db = getDb(req);
	const vehicleId = Number(req.params.id);

	const vehicle = await db('vehicles').where({ id: vehicleId }).first();
	if (!vehicle) {
		return res.status(404).json({ error: 'Vehicle not found' });
	}

	if (vehicle.quantity <= 0) {
		return res.status(409).json({ error: 'Vehicle is out of stock' });
	}

	await db('vehicles').where({ id: vehicleId }).update({ quantity: vehicle.quantity - 1 });
	const updated = await db('vehicles').where({ id: vehicleId }).first();
	return res.status(200).json({ vehicle: serializeVehicle(updated) });
});

router.post('/:id/restock', authenticate, authorize('admin'), async (req: Request, res: Response) => {
	const db = getDb(req);
	const vehicleId = Number(req.params.id);
	const quantity = Number(req.body.quantity);

	if (!Number.isInteger(quantity) || quantity <= 0) {
		return res.status(400).json({ error: 'Quantity must be a positive integer' });
	}

	const vehicle = await db('vehicles').where({ id: vehicleId }).first();
	if (!vehicle) {
		return res.status(404).json({ error: 'Vehicle not found' });
	}

	await db('vehicles').where({ id: vehicleId }).update({ quantity: vehicle.quantity + quantity });
	const updated = await db('vehicles').where({ id: vehicleId }).first();
	return res.status(200).json({ vehicle: serializeVehicle(updated) });
});

export default router;
