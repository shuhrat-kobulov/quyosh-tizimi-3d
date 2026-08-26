// English.
export default {
  code: 'en',
  htmlLang: 'en',
  label: 'English',
  short: 'EN',
  ogLocale: 'en_US',

  ui: {
    docTitle: 'Solar System — A 3D Journey',
    docDescription:
      'An interactive 3D solar system: click a planet and the camera flies to it while the panel shows what we know about it.',

    brandTitle: 'SOLAR SYSTEM',
    brandTagline: 'an interactive 3D journey',
    hint: 'Click a planet · drag to orbit · scroll to zoom',

    langLabel: 'Language',

    loaderStars: 'Lighting the stars…',
    loaderSun: 'Igniting the Sun…',
    loaderBody: 'Building {name}…',
    loaderBelt: 'Scattering the asteroid belt…',
    loaderReady: 'Ready',
    loaderError: 'Error: {message}',

    panelClose: 'Close',
    panelRegion: 'Information about the selected body',
    panelFactTitle: 'Did you know',
    panelSource: 'Source: NASA fact page ↗',

    btnOverview: '⌂ Overview',
    btnOverviewTitle: 'Overview (Esc)',
    btnOrbits: '◎ Orbits',
    btnOrbitsTitle: 'Orbits (O)',
    btnLabels: 'A Labels',
    btnLabelsTitle: 'Labels (L)',
    btnPause: '⏸ Pause',
    btnResume: '▶ Resume',
    btnPauseTitle: 'Pause time (Space)',
    speedLabel: 'Speed',

    offlineReady: 'Ready — this page now opens without an internet connection.',

    errNoWebglTitle: 'Your browser does not support 3D',
    errNoWebglText:
      'This page needs WebGL. Open it in a recent version of Chrome, Safari or Firefox, or turn on hardware acceleration in your browser settings.',
    errInitTitle: 'Could not start the 3D engine',
    errContextTitle: 'Graphics connection lost',
    errContextText: 'The device released its video memory. Please reload the page.',
  },

  kinds: {
    star: 'STAR',
    planet: 'PLANET',
    gasGiant: 'GAS GIANT',
    iceGiant: 'ICE GIANT',
  },

  bodies: {
    sun: {
      name: 'Sun',
      kind: 'star',
      sub: 'A G-class yellow dwarf holding 99.86 percent of the mass of the entire system.',
      facts: [
        ['Diameter', '1,392,700 km'],
        ['Surface temperature', '≈ 5,500 °C'],
        ['Core temperature', '≈ 15,000,000 °C'],
        ['Age', '≈ 4.6 billion years'],
        ['Distance from Earth', '149.6 million km'],
      ],
      fact:
        'Every second it converts 600 million tonnes of hydrogen into helium. The light that leaves it reaches Earth 8 minutes and 20 seconds later.',
    },
    mercury: {
      name: 'Mercury',
      kind: 'planet',
      sub: 'The closest planet to the Sun and the smallest in the system. It has almost no atmosphere.',
      facts: [
        ['Diameter', '4,879 km'],
        ['Distance from Sun', '57.9 million km'],
        ['Year', '88 Earth days'],
        ['Day', '58.6 Earth days'],
        ['Moons', '0'],
        ['Temperature', '−173 … +427 °C'],
      ],
      fact:
        'Its atmosphere cannot hold heat: by day the surface gets hot enough to melt lead, by night it freezes to −170 °C.',
    },
    venus: {
      name: 'Venus',
      kind: 'planet',
      sub: 'The hottest planet in the system. A thick carbon dioxide atmosphere traps the heat.',
      facts: [
        ['Diameter', '12,104 km'],
        ['Distance from Sun', '108.2 million km'],
        ['Year', '225 Earth days'],
        ['Day', '243 Earth days'],
        ['Moons', '0'],
        ['Temperature', '+464 °C'],
      ],
      fact:
        'It spins backwards on its axis — on Venus the Sun rises in the west and sets in the east. Its day is longer than its year.',
    },
    earth: {
      name: 'Earth',
      kind: 'planet',
      sub: 'So far the only body confirmed to carry life. Water covers 71 percent of its surface.',
      facts: [
        ['Diameter', '12,742 km'],
        ['Distance from Sun', '149.6 million km'],
        ['Year', '365.25 days'],
        ['Day', '23 hours 56 min'],
        ['Moons', '1 (the Moon)'],
        ['Average temperature', '+15 °C'],
      ],
      fact:
        'Its axis is tilted 23.4°, and that tilt is exactly what gives us the seasons. The Moon keeps the tilt steady — without it the climate would swing wildly over the centuries.',
    },
    mars: {
      name: 'Mars',
      kind: 'planet',
      sub: 'The red planet. Ice sits at its poles and dried-up river beds run across its surface.',
      facts: [
        ['Diameter', '6,779 km'],
        ['Distance from Sun', '227.9 million km'],
        ['Year', '687 Earth days'],
        ['Day', '24 hours 37 min'],
        ['Moons', '2 (Phobos, Deimos)'],
        ['Average temperature', '−63 °C'],
      ],
      fact:
        'The tallest mountain in the solar system is here: Olympus Mons rises 21 km, roughly 2.5 times the height of Everest.',
    },
    jupiter: {
      name: 'Jupiter',
      kind: 'gasGiant',
      sub: 'The largest planet in the system — all the other planets together weigh less than it does.',
      facts: [
        ['Diameter', '139,820 km'],
        ['Distance from Sun', '778.5 million km'],
        ['Year', '11.9 Earth years'],
        ['Day', '9 hours 56 min'],
        ['Moons', 'more than 95'],
        ['Cloud temperature', '−145 °C'],
      ],
      fact:
        'The Great Red Spot is a storm that has not stopped for at least 350 years. The whole Earth would fit inside it with room to spare.',
    },
    saturn: {
      name: 'Saturn',
      kind: 'gasGiant',
      sub: 'Its rings stretch 280,000 km across, yet in places they are only about 10 metres thick.',
      facts: [
        ['Diameter', '116,460 km'],
        ['Distance from Sun', '1.43 billion km'],
        ['Year', '29.5 Earth years'],
        ['Day', '10 hours 42 min'],
        ['Moons', 'more than 146'],
        ['Cloud temperature', '−178 °C'],
      ],
      fact:
        'It is less dense than water. Given an ocean large enough, Saturn would float in it rather than sink.',
    },
    uranus: {
      name: 'Uranus',
      kind: 'iceGiant',
      sub: 'An ice giant that rolls on its side. Its axis is tilted 98 degrees.',
      facts: [
        ['Diameter', '50,724 km'],
        ['Distance from Sun', '2.87 billion km'],
        ['Year', '84 Earth years'],
        ['Day', '17 hours 14 min'],
        ['Moons', '28'],
        ['Temperature', '−224 °C'],
      ],
      fact:
        'It spins almost lying down — each pole spends 42 years in sunlight, then 42 years in darkness. The coldest temperature in the system was recorded here too.',
    },
    neptune: {
      name: 'Neptune',
      kind: 'iceGiant',
      sub: 'The most distant planet. Its blue colour comes from methane in the atmosphere.',
      facts: [
        ['Diameter', '49,244 km'],
        ['Distance from Sun', '4.5 billion km'],
        ['Year', '165 Earth years'],
        ['Day', '16 hours 6 min'],
        ['Moons', '16'],
        ['Temperature', '−214 °C'],
      ],
      fact:
        'Winds reach 2,100 km/h — the fiercest storms in the system. Neptune was found on paper before it was found in a telescope: mathematics predicted where to look.',
    },
  },
};
