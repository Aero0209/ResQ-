export const playNotificationSound = async () => {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    await audio.play();
  } catch (error) {
    console.warn('Son de notification non disponible:', error);
    // Continuer silencieusement si le son ne peut pas être joué
  }
}; 