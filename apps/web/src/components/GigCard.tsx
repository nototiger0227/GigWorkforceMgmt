import type { GigDto } from '@gig/shared';
import { Urgency } from '@gig/shared';
import clsx from 'clsx';
import { Card, StatusBadge, UrgencyLabel, Button } from './ui';

const urgencyBorder: Record<Urgency, string> = {
  LOW:      'urgency-low',
  MEDIUM:   'urgency-medium',
  HIGH:     'urgency-high',
  CRITICAL: 'urgency-critical',
};

export function GigCard({
  gig,
  onAccept,
  onCancel,
  showActions,
}: {
  gig: GigDto;
  onAccept?: () => void;
  onCancel?: () => void;
  showActions?: 'rider' | 'company';
}) {
  return (
    <Card className={clsx(
      'glass-card-hover flex flex-col gap-3 rounded-2xl overflow-hidden',
      urgencyBorder[gig.urgency]
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white leading-tight truncate">{gig.title}</h3>
          <p className="mt-0.5 text-xs text-slate-500 truncate">{gig.companyName ?? 'Company'}</p>
        </div>
        <StatusBadge status={gig.status} />
      </div>

      {/* Description */}
      {gig.description && (
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{gig.description}</p>
      )}

      {/* Location */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <span className="opacity-60">📍</span>
        <span>{gig.pickupZone}</span>
        <span className="text-slate-600">→</span>
        <span>{gig.serviceArea}</span>
      </div>

      {/* Pay & Meta row */}
      <div className="flex items-end justify-between pt-1 border-t border-white/5">
        <div>
          <p className="text-xl font-bold text-emerald-400">₹{gig.payAmount}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <UrgencyLabel urgency={gig.urgency} />
            {parseFloat(gig.surgeMultiplier) > 1 && (
              <span className="text-xs font-semibold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded-md">
                {gig.surgeMultiplier}× surge
              </span>
            )}
            {gig.partnerSource && (
              <span className="text-xs text-slate-500">via {gig.partnerSource}</span>
            )}
            {gig.matchScore != null && (
              <span className="text-xs text-brand-400 font-medium">{gig.matchScore} match</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">{new Date(gig.startsAt).toLocaleDateString()}</p>
          <p className="text-xs text-slate-600">{new Date(gig.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {/* Actions */}
      {showActions === 'rider' && gig.status === 'OPEN' && onAccept && (
        <Button className="w-full mt-1" onClick={onAccept}>
          ✓ Accept Gig
        </Button>
      )}
      {showActions === 'company' && !['COMPLETED', 'CANCELLED'].includes(gig.status) && onCancel && (
        <Button variant="danger" className="w-full mt-1" onClick={onCancel}>
          Cancel Gig
        </Button>
      )}
    </Card>
  );
}

