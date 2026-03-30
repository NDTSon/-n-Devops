import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';


// Map theme key to audio file name in public/sounds/ (tự động nhận mp3/mp4)
const THEME_SOUNDS = {
  tet: ['tet.mp3', 'tet.mp4'],
  trungthu: ['trungthu.mp3', 'trungthu.mp4', 'trung-thu.mp4'],
  giangsinh: ['giangsinh.mp3', 'giangsinh.mp4', 'giang-sinh.mp4'],
};

export default function SeasonAudioPlayer() {
  const { theme, volumeMap, setVolume } = useTheme();
  const audioRef = useRef();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // Pause and reset if theme is not a season
    if (!THEME_SOUNDS[theme]) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }
    // Set volume
    audio.volume = volumeMap?.[theme] ?? 0.22;
    // Play if not already
    if (audio.src && !audio.paused) return;
    audio.play().catch(() => {});
    // Pause on theme change
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [theme, volumeMap]);


  // Tìm file tồn tại đầu tiên trong danh sách
  let src;
  if (THEME_SOUNDS[theme]) {
    for (const fname of THEME_SOUNDS[theme]) {
      // Không kiểm tra tồn tại thực tế, browser sẽ tự thử load
      src = `/sounds/${fname}`;
      break;
    }
  }

  // Volume slider UI
  const handleVolume = (e) => {
    const v = Number(e.target.value);
    setVolume(theme, v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  return null;
}
