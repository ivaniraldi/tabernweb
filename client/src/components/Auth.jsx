import { useState } from 'react';
import { CharacterCreate } from './CharacterCreate';
import { CharacterSelect } from './CharacterSelect';

export const Auth = ({ onAuthSuccess, backendUrl }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Estado post-login/registro: aguardando selección o creación de personaje
    const [pendingUser, setPendingUser] = useState(null);  // { id, username, role }
    const [pendingToken, setPendingToken] = useState(null);
    const [pendingPlayers, setPendingPlayers] = useState([]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const endpoint = isRegister ? `${backendUrl}/api/auth/register` : `${backendUrl}/api/auth/login`;
        const body = isRegister
            ? { email, username, password }
            : { email, password };

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (data.error) {
                setError(data.error);
                return;
            }

            // Guardar usuario y token pendientes hasta seleccionar personaje
            setPendingUser(data.user);
            setPendingToken(data.token);
            setPendingPlayers(data.players || []);

        } catch {
            setError('Connection error');
        }
    };

    const handleCharacterSelected = (player) => {
        // Construir el objeto completo que espera el juego
        onAuthSuccess({
            ...pendingUser,
            player
        }, pendingToken);
    };

    const handleCharacterCreated = (player) => {
        onAuthSuccess({
            ...pendingUser,
            player
        }, pendingToken);
    };

    // Si tenemos usuario pendiente, mostrar selector o creador de personaje
    if (pendingUser) {
        if (pendingPlayers.length === 0) {
            // Primer personaje: ir directo a creación
            return (
                <CharacterCreate
                    userId={pendingUser.id}
                    username={pendingUser.username}
                    backendUrl={backendUrl}
                    onCreated={handleCharacterCreated}
                />
            );
        }
        return (
            <CharacterSelect
                user={pendingUser}
                players={pendingPlayers}
                backendUrl={backendUrl}
                onSelect={handleCharacterSelected}
            />
        );
    }

    return (
        <div className="auth-overlay">
            <div className="auth-card">
                <h2>{isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
                {error && <p className="error-msg">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            required
                        />
                    </div>
                    {isRegister && (
                        <div className="input-group">
                            <label>Nombre de Usuario</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Como te verán otros jugadores"
                                required
                            />
                        </div>
                    )}
                    <div className="input-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button type="submit" className="primary-btn">
                        {isRegister ? 'Registrarse' : 'Entrar al Mundo'}
                    </button>
                </form>
                <button
                    onClick={() => { setIsRegister(!isRegister); setError(''); }}
                    className="secondary-btn"
                >
                    {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                </button>
            </div>
        </div>
    );
};
