import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { createVehicle, deleteVehicle, fetchVehicles, loginUser, purchaseVehicle, registerUser, restockVehicle, updateVehicle } from './api';
import type { AuthUser, Vehicle } from './types';

type AuthState = {
  token: string;
  user: AuthUser;
};

const authStorageKey = 'car-dealership-auth';

function useAuth() {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    const stored = window.localStorage.getItem(authStorageKey);
    return stored ? (JSON.parse(stored) as AuthState) : null;
  });

  useEffect(() => {
    if (auth) {
      window.localStorage.setItem(authStorageKey, JSON.stringify(auth));
    } else {
      window.localStorage.removeItem(authStorageKey);
    }
  }, [auth]);

  return { auth, setAuth };
}

function Shell({ children, auth, onSignOut }: { children: ReactNode; auth: AuthState | null; onSignOut: () => void }) {
  const location = useLocation();

  return (
    <div className="page-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <div>
          <p className="eyebrow">Inventory System</p>
          <h1>Car Dealership Control Room</h1>
        </div>
        <nav className="topbar-nav">
          <Link className={location.pathname === '/dashboard' ? 'nav-link active' : 'nav-link'} to="/dashboard">Dashboard</Link>
          {!auth ? <Link className={location.pathname === '/login' ? 'nav-link active' : 'nav-link'} to="/login">Login</Link> : null}
          {!auth ? <Link className={location.pathname === '/register' ? 'nav-link active' : 'nav-link'} to="/register">Register</Link> : null}
          {auth ? <button className="nav-button" onClick={onSignOut}>Sign out</button> : null}
        </nav>
      </header>
      <main className="main-grid">{children}</main>
    </div>
  );
}

function AuthForm({ mode, onSubmit }: { mode: 'login' | 'register'; onSubmit: (values: { name?: string; email: string; password: string }) => Promise<void> }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <section className="panel auth-panel">
      <div>
        <p className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Create access'}</p>
        <h2>{mode === 'login' ? 'Sign in to manage inventory' : 'Register a new dealership account'}</h2>
      </div>
      <form
        className="stack"
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError('');
          try {
            await onSubmit({ name: mode === 'register' ? name : undefined, email, password });
            navigate('/dashboard');
          } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Something went wrong');
          } finally {
            setLoading(false);
          }
        }}
      >
        {mode === 'register' ? <label><span>Name</span><input value={name} onChange={(event) => setName(event.target.value)} required /></label> : null}
        <label><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} /></label>
        {error ? <p className="error-box">{error}</p> : null}
        <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      </form>
    </section>
  );
}

function VehicleCard({ vehicle, onPurchase, onDelete, onSave, canAdmin }: {
  vehicle: Vehicle;
  onPurchase: (vehicle: Vehicle) => Promise<void>;
  onDelete: (vehicle: Vehicle) => Promise<void>;
  onSave: (vehicle: Vehicle, patch: Partial<Vehicle>) => Promise<void>;
  canAdmin: boolean;
}) {
  const [price, setPrice] = useState(String(vehicle.price));
  const [quantity, setQuantity] = useState(String(vehicle.quantity));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setPrice(String(vehicle.price));
    setQuantity(String(vehicle.quantity));
  }, [vehicle.price, vehicle.quantity]);

  return (
    <article className="vehicle-card">
      <div className="vehicle-header">
        <div>
          <p className="eyebrow">{vehicle.category}</p>
          <h3>{vehicle.make} {vehicle.model}</h3>
        </div>
        <span className="price-pill">${vehicle.price.toLocaleString()}</span>
      </div>
      <p className="vehicle-meta">Model year {vehicle.year} · {vehicle.quantity} in stock</p>

      {editing ? (
        <div className="edit-grid">
          <label><span>Price</span><input value={price} onChange={(event) => setPrice(event.target.value)} /></label>
          <label><span>Quantity</span><input value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
          <div className="button-row">
            <button className="secondary-button" type="button" onClick={() => setEditing(false)}>Cancel</button>
            <button className="primary-button" type="button" onClick={async () => {
              await onSave(vehicle, { price: Number(price), quantity: Number(quantity) });
              setEditing(false);
            }}>Save</button>
          </div>
        </div>
      ) : null}

      <div className="button-row wrap">
        <button className="primary-button" type="button" disabled={vehicle.quantity === 0} onClick={() => onPurchase(vehicle)}>
          {vehicle.quantity === 0 ? 'Out of stock' : 'Purchase'}
        </button>
        {canAdmin ? <button className="secondary-button" type="button" onClick={() => setEditing((value) => !value)}>{editing ? 'Close editor' : 'Edit'}</button> : null}
        {canAdmin ? <button className="danger-button" type="button" onClick={() => onDelete(vehicle)}>Delete</button> : null}
      </div>
    </article>
  );
}

function Dashboard({ auth, onMutate }: { auth: AuthState; onMutate: () => Promise<void> }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState({ make: '', model: '', category: '', minPrice: '', maxPrice: '' });
  const [form, setForm] = useState({ make: '', model: '', year: 2024, category: 'sedan', price: 0, quantity: 0 });

  const canAdmin = auth.user.role === 'admin';

  async function loadVehicles(currentSearch = search) {
    setError('');
    const response = await fetchVehicles(auth.token, {
      ...currentSearch,
      minPrice: currentSearch.minPrice ? Number(currentSearch.minPrice) : undefined,
      maxPrice: currentSearch.maxPrice ? Number(currentSearch.maxPrice) : undefined,
    });
    setVehicles(response.vehicles);
  }

  useEffect(() => {
    void loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSummary = useMemo(() => {
    if (!search.make && !search.model && !search.category && !search.minPrice && !search.maxPrice) {
      return 'Showing the full inventory';
    }
    return 'Search filters are active';
  }, [search]);

  return (
    <section className="dashboard-layout">
      <section className="panel hero-panel">
        <p className="eyebrow">Signed in as {auth.user.email}</p>
        <h2>Manage the lot, pricing, and stock in one place.</h2>
        <p className="lede">{filteredSummary}</p>
        {error ? <p className="error-box">{error}</p> : null}
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Search</p>
            <h3>Filter inventory</h3>
          </div>
          <button className="secondary-button" type="button" onClick={() => { setSearch({ make: '', model: '', category: '', minPrice: '', maxPrice: '' }); void loadVehicles({ make: '', model: '', category: '', minPrice: '', maxPrice: '' }); }}>Reset</button>
        </div>
        <div className="search-grid">
          {(['make', 'model', 'category', 'minPrice', 'maxPrice'] as const).map((key) => (
            <label key={key}>
              <span>{key}</span>
              <input value={search[key]} onChange={(event) => setSearch((current) => ({ ...current, [key]: event.target.value }))} />
            </label>
          ))}
        </div>
        <button className="primary-button" type="button" onClick={() => void loadVehicles()}>Apply search</button>
      </section>

      {canAdmin ? (
        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Admin tools</p>
              <h3>Add a vehicle</h3>
            </div>
          </div>
          <div className="search-grid vehicle-form-grid">
            <label><span>Make</span><input value={form.make} onChange={(event) => setForm((current) => ({ ...current, make: event.target.value }))} /></label>
            <label><span>Model</span><input value={form.model} onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))} /></label>
            <label><span>Year</span><input type="number" value={form.year} onChange={(event) => setForm((current) => ({ ...current, year: Number(event.target.value) }))} /></label>
            <label><span>Category</span><input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} /></label>
            <label><span>Price</span><input type="number" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))} /></label>
            <label><span>Quantity</span><input type="number" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))} /></label>
          </div>
          <button className="primary-button" type="button" onClick={async () => { await createVehicle(auth.token, form); await loadVehicles(); await onMutate(); }}>Add vehicle</button>
        </section>
      ) : null}

      <section className="vehicle-list">
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            canAdmin={canAdmin}
            onPurchase={async (currentVehicle) => {
              await purchaseVehicle(auth.token, currentVehicle.id);
              await loadVehicles();
            }}
            onDelete={async (currentVehicle) => {
              await deleteVehicle(auth.token, currentVehicle.id);
              await loadVehicles();
            }}
            onSave={async (currentVehicle, patch) => {
              await updateVehicle(auth.token, currentVehicle.id, patch);
              await loadVehicles();
            }}
          />
        ))}
      </section>
    </section>
  );
}

export default function App() {
  const { auth, setAuth } = useAuth();

  return (
    <Shell auth={auth} onSignOut={() => setAuth(null)}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={!auth ? <AuthForm mode="login" onSubmit={async (values) => setAuth(await loginUser({ email: values.email, password: values.password }))} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={!auth ? <AuthForm mode="register" onSubmit={async (values) => { await registerUser({ name: values.name || '', email: values.email, password: values.password }); setAuth(await loginUser({ email: values.email, password: values.password })); }} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={auth ? <Dashboard auth={auth} onMutate={async () => Promise.resolve()} /> : <Navigate to="/login" replace />} />
      </Routes>
    </Shell>
  );
}