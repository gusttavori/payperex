import React, { useState, useEffect } from 'react';

const InstallPrompt = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. Verifica se o app JÁ ESTÁ instalado (rodando como standalone)
    const isAlreadyInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(isAlreadyInstalled);

    if (isAlreadyInstalled) return;

    // 2. Detecta se é um dispositivo Apple (iOS)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // No iOS, mostramos o aviso manualmente após alguns segundos para não assustar no primeiro frame
      setTimeout(() => setShowPrompt(true), 2000);
    }

    // 3. Intercepta o evento nativo de instalação do Android (Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Impede o banner padrão feio do navegador
      setDeferredPrompt(e); // Guarda a função nativa para usarmos no nosso botão
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Função disparada quando o usuário do Android clica em "Instalar"
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); // Abre a janelinha nativa do celular
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  // Se já estiver instalado ou não for para mostrar, não renderiza nada
  if (!showPrompt || isStandalone) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <button onClick={() => setShowPrompt(false)} style={styles.closeButton}>
          ✕
        </button>
        
        <div style={styles.header}>
          <img src="/pwa-192x192.png" alt="App Icon" style={styles.icon} />
          <div>
            <h3 style={styles.title}>Instalar Payperex</h3>
            <p style={styles.subtitle}>Acesso rápido e offline</p>
          </div>
        </div>

        {isIOS ? (
          // VISÃO iOS (Instrução Manual)
          <div style={styles.instructions}>
            <p>Para instalar no seu iPhone ou iPad:</p>
            <ol style={styles.list}>
              <li>Toque no ícone de <strong>Compartilhar</strong> <span style={{fontSize: '1.2rem'}}>⍗</span> na barra do navegador.</li>
              <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> <span style={{fontSize: '1.2rem'}}>+</span>.</li>
            </ol>
          </div>
        ) : (
          // VISÃO ANDROID (Botão de Download Direto)
          <button onClick={handleInstallClick} style={styles.installButton}>
            Instalar Aplicativo
          </button>
        )}
      </div>
    </div>
  );
};

// Estilos básicos inline atualizados para Verde e Branco
const styles = {
  overlay: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    maxWidth: '400px',
    zIndex: 9999,
  },
  card: {
    backgroundColor: '#ffffff', // Fundo branco
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    border: '1px solid #e5e7eb', // Borda sutil
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#9ca3af' // Cinza claro para não chamar tanta atenção
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px'
  },
  icon: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    border: '1px solid #f3f4f6'
  },
  title: { margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1f2937' },
  subtitle: { margin: 0, fontSize: '14px', color: '#6b7280' },
  installButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#16a34a', // Verde principal
    color: '#ffffff', // Texto branco
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)' // Sombra esverdeada sutil
  },
  instructions: { fontSize: '14px', color: '#374151' },
  list: { margin: '10px 0 0 0', paddingLeft: '20px', lineHeight: '1.6' }
};

export default InstallPrompt;