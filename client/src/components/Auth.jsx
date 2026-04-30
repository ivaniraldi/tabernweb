import { useState } from 'react';

export const Auth = ({ onAuthSuccess }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
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

            if (isRegister) {
                setIsRegister(false);
                setError('Registration successful! Please login.');
                return;
            }

            onAuthSuccess(data.user, data.token);
        } catch (err) {
            setError('Connection error');
        }
    };

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
                            <label>Nombre en el Juego</label>
                            <input 
                                type="text" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                placeholder="Como te verán otros"
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
                    onClick={() => setIsRegister(!isRegister)} 
                    className="secondary-btn"
                >
                    {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                </button>
            </div>
        </div>
    );
};
