/* Shared vocabulary: the studio's own copy and the numbers the
   timeline is tuned against. Kept out of components so a chapter's
   JSX stays about motion, not content. */

export const STUDIO = {
  name: 'VOLTERRA',
  role: 'Luxury Interior Studio',
  email: 'studio@volterra.design',
  phone: '+39 0588 555 0142',
  address: ['Via dell’Alabastro 14', '56048 Volterra, Pisa', 'Italy'],
  social: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'Behance', href: 'https://behance.net' },
  ],
}

/* Chapter registry — drives the nav, the progress rail and the
   background colour the site tweens through as you descend. */
export const CHAPTERS = [
  { id: 'hero', index: '01', title: 'Overture', ground: '#F7F5F2', figure: '#151515' },
  { id: 'living', index: '02', title: 'Living Room', ground: '#F1EDE7', figure: '#151515' },
  { id: 'light', index: '03', title: 'Light', ground: '#141210', figure: '#F7F5F2' },
  { id: 'kitchen', index: '04', title: 'Kitchen', ground: '#EFEAE3', figure: '#151515' },
  { id: 'bedroom', index: '05', title: 'Bedroom', ground: '#EAE3D9', figure: '#151515' },
  { id: 'materials', index: '06', title: 'Materials', ground: '#FFFFFF', figure: '#151515' },
  { id: 'blueprint', index: '07', title: 'Blueprint', ground: '#0B0B0B', figure: '#F7F5F2' },
  { id: 'finale', index: '08', title: 'The Villa', ground: '#101010', figure: '#F7F5F2' },
  { id: 'contact', index: '09', title: 'Contact', ground: '#F7F5F2', figure: '#151515' },
]

export const MATERIALS = [
  { key: 'travertine', name: 'Travertine', origin: 'Tivoli, Lazio', note: 'Open-pored, cut against the bed' },
  { key: 'walnut', name: 'Walnut', origin: 'Canaletto, Veneto', note: 'Quarter-sawn, oiled by hand' },
  { key: 'concrete', name: 'Concrete', origin: 'Cast in place', note: 'Polished to 400 grit, waxed' },
  { key: 'marble', name: 'Marble', origin: 'Calacatta, Carrara', note: 'Book-matched across the join' },
  { key: 'brass', name: 'Brass', origin: 'Brushed, unlacquered', note: 'Left to take its own patina' },
  { key: 'glass', name: 'Glass', origin: 'Smoked, low-iron', note: '12 mm, polished arris' },
]
