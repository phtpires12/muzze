import { forwardRef } from 'react';
import muzzeLogo from '@/assets/muzze-logo-white.png';

interface StreakShareCardProps {
  streakCount: number;
}

const StreakShareCard = forwardRef<HTMLDivElement, StreakShareCardProps>(
  ({ streakCount }, ref) => {
    return (
      <div
        ref={ref}
        className="flex flex-col items-center justify-center"
        style={{
          width: 1080,
          height: 1920,
          background: 'linear-gradient(180deg, #FF9A5F 0%, #9333EA 50%, #7C3AED 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Logo */}
        <img
          src={muzzeLogo}
          alt="Muzze"
          style={{
            width: 200,
            height: 'auto',
            marginBottom: 120,
          }}
        />

        {/* Fire Emoji */}
        <div
          style={{
            backgroundColor: 'rgba(39, 39, 42, 0.9)',
            borderRadius: '50%',
            padding: 60,
            marginBottom: 60,
            boxShadow: '0 0 60px rgba(255, 154, 95, 0.4)',
          }}
        >
          <span
            style={{
              fontSize: 180,
              filter: 'drop-shadow(0 0 30px rgba(255, 154, 95, 0.8))',
            }}
          >
            🔥
          </span>
        </div>

        {/* Streak Number */}
        <div
          style={{
            fontSize: 220,
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1,
            textShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          {streakCount}
        </div>

        {/* Label */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.95)',
            marginTop: 20,
            letterSpacing: 2,
          }}
        >
          {streakCount === 1 ? 'dia de ofensiva!' : 'dias de ofensiva!'}
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 100,
            fontSize: 42,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.8)',
            letterSpacing: 3,
          }}
        >
          muzze.app
        </div>
      </div>
    );
  }
);

StreakShareCard.displayName = 'StreakShareCard';

export default StreakShareCard;
