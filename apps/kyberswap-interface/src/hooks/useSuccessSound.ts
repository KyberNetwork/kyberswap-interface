import successSoundFile from '@/assets/sounds/success.wav'
import useSound from 'use-sound'

export const useSuccessSound = () => {
  const [play] = useSound(successSoundFile, {
    volume: 0.3, // Adjust volume as needed
  })

  return play
}
