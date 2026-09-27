import Catalog from '@/components/Catalog';

/**
 * Pooja Vidhis: the rites that happen on a particular day.
 *
 * The catalogue itself lives in one component and is rendered by two routes,
 * so the tab you are on is a URL rather than client state -- bookmarkable,
 * shareable, and rendered on the server like everything else here.
 */
export default function PoojaVidhisPage() {
  return <Catalog section="pooja" />;
}
