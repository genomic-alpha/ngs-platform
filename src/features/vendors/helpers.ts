export function getTier(tier: string): string {
  const tierLabels: Record<string, string> = { A: 'Tier A', B: 'Tier B', C: 'Tier C' };
  return tierLabels[tier] || tier;
}

export function getRegulatoryBadge(regulatory: string): string {
  return regulatory;
}
