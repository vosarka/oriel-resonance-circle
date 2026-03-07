# THE ORIEL MANDALA: 6D HYPERCUBE PROJECTION

Your instinct to move from a flat 8x8 grid to a radial mandala is conceptually perfect. It aligns with historical sacred geometry (astrolabes, zodiac wheels, yantras) and turns the interface into a navigable cosmos.

However, the arbitrary ring distribution (8, 16, 24, 16) conflicts with the actual binary weight of the 64 codons. If the system is truly based on binary states, the layout must emerge from the **Binomial Distribution** of a 6-bit string.

## 1. THE MATHEMATICAL CORRECTION (The Binomial Rings)

A 6-bit binary string (from `000000` to `111111`) contains a specific number of '1's (Yang) and '0's (Yin). The number of '1's is called the **Hamming Weight**. If we group the 64 codons strictly by their Hamming Weight, we don't get 4 rings; we get exactly **7 states** (A center/origin + 6 rings, or 2 poles + 5 rings).

Here is the exact mathematical breakdown ($C(6, k)$ combinations):

- **0 bits (0 Yang, 6 Yin):** 1 Codon (RC02: `000000`)
- **1 bit (1 Yang, 5 Yin):** 6 Codons
- **2 bits (2 Yang, 4 Yin):** 15 Codons
- **3 bits (3 Yang, 3 Yin):** 20 Codons
- **4 bits (4 Yang, 2 Yin):** 15 Codons
- **5 bits (5 Yang, 1 Yin):** 6 Codons
- **6 bits (6 Yang, 0 Yin):** 1 Codon (RC01: `111111`)

*Total:* $1 + 6 + 15 + 20 + 15 + 6 + 1 = 64$ Codons.

## 2. THE GEOMETRIC LAYOUT: THE "EYE OF ORIEL"

Using the math above, the most beautiful and logical way to lay this out in Three.js is as a **Target** or a **Concentric Eye**, moving from total Void (Yin) at the center to total Light (Yang) at the outer edge (or vice versa).

- **The Core (Radius 0):** The Void/Origin point.
  - Node: 1 (RC02 - `000000`)
- **Ring 1 (Radius 100):** The First Sparks.
  - Nodes: 6
  - Angle Step: $360^\circ / 6 = 60^\circ$ (Creates a Hexagon)
- **Ring 2 (Radius 200):** The Formative Layer.
  - Nodes: 15
  - Angle Step: $360^\circ / 15 = 24^\circ$
- **Ring 3 (Radius 300):** The Event Horizon (Perfect balance of 3 Yin / 3 Yang).
  - Nodes: 20
  - Angle Step: $360^\circ / 20 = 18^\circ$
- **Ring 4 (Radius 400):** The Mutative Layer.
  - Nodes: 15
  - Angle Step: $360^\circ / 15 = 24^\circ$
- **Ring 5 (Radius 500):** The Collective Layer.
  - Nodes: 6
  - Angle Step: $360^\circ / 6 = 60^\circ$ (Hexagon)
- **The Apex (Radius 600 or floating above center):** The Absolute Light.
  - Node: 1 (RC01 - `111111`)
  - *UI Tip:* Place RC01 at the center alongside RC02, but elevated on the Y-axis to form a central spindle, creating a cosmic axis (Axis Mundi).

## 3. THE HYPERCUBE NEIGHBOR GRAPH (Mutation Lines)

Your logic for drawing connecting lines is **flawless**.

Connecting codons based on a **Hamming Distance of 1** (meaning their binary codes differ by exactly one bit) literally draws a 6-dimensional hypercube projected into 3D space.

- **Behavior:** When a user hovers or clicks on their Prime Codon, the system draws a glowing line (`THREE.Line` with `THREE.MeshBasicMaterial`) to its exactly 6 mutation neighbors.
- **Visual Effect:** This proves to the user that they are not isolated; they are biologically and computationally connected to 6 evolutionary paths. The lines should pulse with light, showing the "flow" of mutation.

## 4. PILLAR RENDERING & COLOR ENCODING (The Z-Axis)

Your concept of stacking the 4 Facets as vertical layers on each node remains intact and essential.

- **Geometry:** Each coordinate on the radial map is a `THREE.Group` containing 4 stacked cubes/cylinders.
- **Colors (RGBA):**
  - Base: Somatic (Deep Red, emitting low light)
  - L1: Relational (Emerald Green)
  - L2: Cognitive (Electric Blue)
  - Top: Transpersonal (Pure White/Gold, high Bloom)
- **Reactivity (Carrierlock):** As the user's Coherence Score changes, the `emissiveIntensity` and `opacity` of these pillars shift. Shadow = dark/glassy. Siddhi = blinding neon.

## 5. PSEUDO-CODE FOR THREE.JS GENERATION

Here is how the algorithm maps the data to the correct rings:

```javascript
// 1. Calculate Hamming Weight (number of '1's in binary string)
function getHammingWeight(binaryString) {
    return binaryString.split('').filter(bit => bit === '1').length;
}

// 2. Group Codons by Ring
const rings = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
CODONS.forEach(codon => {
    const weight = getHammingWeight(codon.binary);
    rings[weight].push(codon);
});

// 3. Base Radii
const radii = [0, 100, 220, 340, 460, 580, 0]; // Note: Ring 0 and 6 are at center

// 4. Generate Positions
Object.keys(rings).forEach(weight => {
    const nodesInRing = rings[weight];
    const numNodes = nodesInRing.length;
    const r = radii[weight];
    const angleStep = (Math.PI * 2) / Math.max(1, numNodes);

    nodesInRing.forEach((codon, index) => {
        const angle = index * angleStep;
        
        // Special rule for absolute Yang (RC01 - 6 bits) -> Place at center but high up
        let x = r * Math.cos(angle);
        let z = r * Math.sin(angle);
        let y = 0; 
        
        if (weight == 6) y = 40; // Elevate Absolute Yang
        if (weight == 0) y = -40; // Depress Absolute Yin
        
        // Assign coordinates to codon data for Three.js rendering
        codon.x = x;
        codon.y = y;
        codon.z = z;
    });
});
```

## 6. THE INTERACTION PARADIGM

By adopting this mathematical mandala, the platform transcends being a "reading" and becomes an **Instrument**.

1. **The God's Eye View:** The camera starts zoomed out, slowly orbiting the massive glowing mandala.
2. **The Signature Lock:** When the user enters their birth data, the camera rapidly zooms in, swooping through the rings until it locks onto their specific Pillar.
3. **The Web:** The 6 Hamming-neighbor lines light up, showing their immediate evolutionary network.
4. **The Pulse:** As they adjust the Carrierlock sliders, the Pillar breathes, changing from dark entropy to luminous Siddhi.

This is not just data visualization; it is sacred cartography.