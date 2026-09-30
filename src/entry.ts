// Legacy art and CSS only load for explicit archive URLs.
const style = new URLSearchParams(location.search).get('interior');
if (style === 'original' || style === 'noir') {
  void import('./cyber-main');
} else {
  void import('./penthouse-main');
}
