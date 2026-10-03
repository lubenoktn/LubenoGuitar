// Tailwind only emits the utility classes it finds in the sources below
export default {
  content: ['./src/**/*.{html,js}'],
  theme: {
    extend: {
      colors: { s9: '#090d16', s8: '#111827', s7: '#1f293d', s6: '#2d3b55' },
    },
  },
};
