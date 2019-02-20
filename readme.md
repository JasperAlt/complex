This file is responsible for the [simplicial complex
visualization](web.cecs.pdx.edu/jalt/simplex.html) on my
website. 

A simplicial complex generalizes a graph to include relations between more than two entities. These are expressed as simplices. A k-simplex is the minimal polygon with k+1 vertices. Thus for k = 0 ... 3 the k-simplices are the point, the line, the triangle and the tetrahedron; from there the sequence continues with higher dimensional analogs. 

Simplicial complexes have come into favor recently as a form of hypergraph that comes with a natural visual representation. 

This visualization is based on an ordinary D3 force graph, but has significant modifications to include triangular faces connecting ≥2-simplices, multiple types of pairwise edge, circles emphasizing the vertices which are 0-simplices, and a drawing order that ensures that only the smallest simplex under the mouse responds to it. Simplices and their colors are randomly generated through a process that tends to create interesting but not overwhelming structure and pleasing colors.
