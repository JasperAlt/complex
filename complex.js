var width = 450;
var height = 450;
var cx = width/2;
var cy = height/2;

var complex = [];
var colors = [];

var always_vertex_labels = true;
var always_simplex_labels = false;

var S = Math.floor(Math.random() * 16); //random up to 16 simplices
if(S < 3) S = 3; //min 3
  
var names = "abcdefghijklmnopqrstuvwxyz".split(""); // node names

for(s = 0; s < S; ++s) //generate simplices
{
  var named = names.slice(); //local copy of name list
  complex.push([]);
  for(n = 0; n < (Math.floor(Math.random() * 6) + 1); ++n)
    complex[s].push(named.splice(Math.floor(Math.random()*named.length), 1)[0]);
    //splice the names we use out of the copied list 
    //so vertices don't reappear in the same simplex
  complex[s].sort(); //impose standard ordering on vertices for all simplices
}

for(s = 0; s < complex.length; ++s) //random RGB colors for each simplex
{
  var a = [];  
  a[0] = Math.floor(Math.random()*0xF); //random hex values
  a[1] = Math.floor(Math.random()*0xF);
  a[2] = Math.floor(Math.random()*0xF);

  if(a[0] + a[1] + a[2] > 2 * 0xf) //if the values add up to too bright
  {
    console.log("Changed color")
    i = Math.floor(Math.random()*4); // divide one of the values by 3
    a[i] = Math.round(a[i]/3);
  } // (prevents very faint colors)
  
  colors[s] = "#" + (a[0]).toString(16) + (a[1]).toString(16) + (a[2]).toString(16);
}


var graph = d3.select(".complex")
  .select("svg")
  .attr("width", width)
  .attr("height", height);

var simulation = d3.forceSimulation()
  .force("link", d3.forceLink().distance(70).id(function(d){return d.id;}))
  .force("gravity", d3.forceManyBody().strength(25).distanceMin(220))
  .force("mid", d3.forceManyBody().strength(-100).distanceMax(120))
  .force("center", d3.forceCenter(width/2, height/2));

links = [];
nodes = [];
faces = [];
snames = []; // simplex names

complex.sort(function(a,b) { 
  // sort simplices by size
  // this will determine the drawing order,
  // making it so the smallest one under mouse
  // gets mouseover effects
  return a.length - b.length;
});

// fill out data structures for the force graph

links = [];
faces = [];
var loaded = [];
links_rendered = [];


if(snames = [])
  for(s in complex)
    snames.push({
      "text": "<tspan font-style=\"italic\">&sigma;"
      + "</tspan><tspan font-size=\"7pt\"  dy=\"+1ex\">" 
      + s + "</span>"

    });  


if(!nodes.length)//only on the first load (this viz only loads once)
  for(s in complex)
    for(i = 0; i < complex[s].length; ++i)
      if(loaded.indexOf(complex[s][i]) < 0) 
      // only create nodes for vertices which actually appear in simplices
      // and only create them once
      // because complex was sorted by size, vertices which appear in 1-simplices will be registered as single
        nodes.push({
          "id": complex[s][i], 
          "single": (complex[s].length == 1), 
          //note which vertices are 1-simplices
          "color": colors[s], 
          "complex": s
        }),
        loaded.push(complex[s][i]);


//lines
for(s in complex) //each simplex
  for(i = 0; i < complex[s].length; ++i) //each vertex
    for(j = 1; i + j < complex[s].length; ++j) //each higher-index vertex
      links.push({
        "source": complex[s][i], 
        "target": complex[s][i+j], 
        "complex": s, 
        "color": colors[s], 
        "opacity": (complex[s].length==2) 
        // only render 2-simplex lines (edges)
        // the rest are just here for the link force
        // (visible lines on >2-simplices are triangle borders)
      });

//triangles
for(s in complex) //each simplex
{
  for(i = 0; i < complex[s].length-2; ++i) //each vertex
    for(j = i + 1; j < complex[s].length-1; ++j) //each higher-index vertex
      for(k = j + 1; k < complex[s].length; ++k) //each third higher vertex
        faces.push({
          "a": complex[s][i], 
          "b": complex[s][j], 
          "c": complex[s][k], 
          "opacity": (0.7/complex[s].length - 0.1 + Math.random()/5), 
          //randomize face opacity for a little false 3d effect
          "complex": s, 
          "color":colors[s]
        }); 
}
//console.log(faces);

faces.reverse();//think this was so mouseover always activates the smallest simplex under the cursor
links.reverse();//ensure links from small simplices are drawn on top

for(l in links)
  if(links[l].opacity)
    links_rendered.push(links[l]);

//console.log(faces.length);

//append group elements
var face = graph.append("g") 
  .attr("class", "faces")

var link = graph.append("g")
  .attr("class", "links")

var node = graph.append("g")
  .attr("class", "nodes")

//append triangles
var triangles = face
  .selectAll("path") //faces are triangular paths
  .data(faces)
  .enter().append("path")
    .attr("class", function(d, i) { return "c" + d.complex;})
    .attr("fill", function(d){return d.color;})
    .attr("fill-opacity", function(d) {return d.opacity;})
    .attr("stroke-opacity", function(d) { 
      return (d.opacity + 0.45)/(2 * (complex[d.complex].length-2));
      // edges get a little more transparent as complex gets larger
    })
    .attr("stroke-width", "1px")
    .attr("stroke", function(d){return d.color;})
    .on("mouseover", function(d) {
      d3.selectAll(".c" + d.complex)
        .attr("fill-opacity", function(e){return e.opacity + 0.1;})
      d3.selectAll(".label" + d.complex)
        .attr("opacity", 1)
    })
    .on("mouseout", function(d) {
      d3.selectAll(".c" + d.complex)
        .attr("fill-opacity", function(e) { return e.opacity;})
      d3.selectAll(".label" + d.complex)
        .attr("opacity", (always_simplex_labels || 0))
    })
//append lines
var lines = link
  .selectAll("path") // lines are linear paths
  .data(links_rendered) // only for the rendered links, ie 2-simplices
  .enter().append("path")
  .attr("class", function(d,i) {return "c " + d.complex;})
  .attr("stroke", function(d){return d.color;})
  .attr("stroke-width", 2)
  .on("mouseover", function(d) { //mouseover activates labels
    d3.select(this)
      .attr("stroke-width", 4)
    d3.selectAll(".label" + d.complex)
      .attr("opacity", 1)
  })
  .on("mouseout", function(d) {
    d3.select(this)
      .attr("stroke-width", 2)
    d3.selectAll(".label" + d.complex)
      .attr("opacity", (always_simplex_labels || 0))
  })
  .attr("pointer-events", "all")
  .attr("opacity", function(d) { return 0.5*d.opacity + 0.35;});

//append 1-simplices
var circles = node
    .selectAll("g")
    .data(nodes.filter(function(d){return d.single;}))
    .enter().append("circle")
  .attr("r", 5)
  .attr("class", function(d,i) {return "c" + d.complex;})
  .attr("fill", function(d){return d.color;})
  .attr("fill-opacity", function(d) { return 0.4;})
  .attr("stroke", function(d){return d.color;})
  .attr("stroke-opacity", function(d) { 
    return (d.opacity + 0.45)/(2 * (complex[d.complex].length-2));
  })
  .on("mouseover", function(d,i) { 
    d3.selectAll(".label" + d.complex)
      .attr("opacity", 1)
    d3.select(this)
      .attr("fill-opacity", function(e){return 0.6;})
  })
  .on("mouseout", function(d,i) { 
    d3.selectAll(".label" + d.complex)
      .attr("opacity", (always_simplex_labels || 0))
    d3.select(this)
      .attr("fill-opacity", function(e){return 0.4;})
  })
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

//append vertices
var dots = node
  .selectAll("g")
  .data(nodes)
  .enter().append("circle")
         .attr("r", 2)
          .attr("fill", "black")
    .attr("opacity", 0.7)
    .on("mouseover", function(d,i) { 
      d3.select(this).attr("r", 3);
      if(d.single) {
        d3.selectAll(".c" + d.complex).attr("r", 6);
        d3.selectAll(".label" + d.complex)
          .attr("opacity", 1)
      }
    })
    .on("mouseout", function(d,i) { 
      d3.select(this).attr("r", 2);
      if(d.single) {
        d3.selectAll(".c" + d.complex).attr("r", 5);
        d3.selectAll(".label" + d.complex)
          .attr("opacity", (always_simplex_labels || 0))
      }
    })
          .call(d3.drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended));

//append simplex labels
var slabels = graph 
  .append("g")
  .selectAll("text")
  .data(complex)
  .enter().append("text")
    .style("background-color", "transparent")
    .style("position", "absolute")
    .attr("class", function(d,i){return "label" + i})
    .attr("font-size", "10pt")
    .attr("x", -15)
    .attr("y", -15)
    .attr("pointer-events", "none")
    .attr("opacity", (always_simplex_labels || 0))
    .html(function(d,i){return snames[i].text;});

//append vertex labels
var labels = node
  .selectAll("text")
  .data(nodes)
  .enter().append("text")
  .attr("font-size", "10pt")
  .attr("pointer-events", "none")
  .html(function(d, i) { 
    return "<tspan font-style=\"italic\">" + d.id + "</tspan>";
  })
  .attr("fill", "black");

//apply forces to elements
simulation
        .nodes(nodes)
        .on("tick", ticked)
  .alphaTarget(0.0) 
  .alphaDecay(0.01)

simulation.force("link")
        .links(links);
  //all links are used for the force sim, even if they aren't rendered

function ticked() {
    var positions = Array(names.length).fill([]);

     circles 
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; })
    .attr("stroke-width", 1)

     dots 
          .attr("cx", function(d, i) { 
      // we record the positions of dots when we render them
      positions[names.indexOf(nodes[i].id)] = [d.x, d.y];  
      return d.x; 
    })
          .attr("cy", function(d) { return d.y; })

     lines 
    .attr("d", function(d) {
      return "M " + d.source.x 
        + " " + d.source.y 
        + " L " + d.target.x 
        + " " + d.target.y;
    })
  
   triangles 
    .attr("d", function(d) {
      return "M " + positions[names.indexOf(d.a)][0]
      + " " + positions[names.indexOf(d.a)][1] 
      + " L " + positions[names.indexOf(d.b)][0] 
      + " " + positions[names.indexOf(d.b)][1] 
      + " L " + positions[names.indexOf(d.c)][0] 
      + " " +  positions[names.indexOf(d.c)][1]
      + " L " + positions[names.indexOf(d.a)][0] 
      + " " +  positions[names.indexOf(d.a)][1]
    ;})

     labels 
  //update vertex label positions
          .attr("x", function(d) { return d.x + 4; })
          .attr("y", function(d) { return d.y - 7; })
    .attr("fill", "black");

    slabels
  // simplex label positions are computed by averaging the 
  // coordinates of their simplices' vertices
    .attr("x", function(d, i) {
      var center = 0;
      for(v in d) if(positions[names.indexOf(d[v])])
        center += positions[names.indexOf(d[v])][0];
      if(center)
        center /= d.length;

      return center + ((d.length <= 2) ? -16 : 0);
      //offset 1- and 2-simplex labels horizontally for legibility
    })
    .attr("y", function(d, i) {
      var center = 0;
      for(v in d) if(positions[names.indexOf(d[v])])
        center += positions[names.indexOf(d[v])][1];
      if(center)
        center /= d.length;

      return center + ((d.length < 2) ? -7 : 0);
      // only 1-simplex labels get a vertical offset, 
      // to appear level with & opposite the vertex label
    })
}

var text = d3.select(".legend") //Place legend text
  .selectAll("span")
  .data(complex)
  .enter()
  .append("span")
  .html(function(d,i) {
    var contents = "";
    for(j = 0; j < d.length; ++j)
      contents += d[j] + ((j < d.length - 1) ? ",&nbsp;" : "&nbsp;"); 
    
    // the colored lines in the legend are just dashes inside spans
    return "<span style=\"font-weight:bold; color:" 
      + colors[i] + "\">&nbsp;&mdash;&nbsp;</span><em>&sigma;</em>"
      + "<sub style=\"font-size:7pt\">" 
      + i + "</sub>&nbsp;=&nbsp;&#12296;&nbsp;<em>" 
      + contents + "</em>&#12297;<br>";
  });


//drag helpers
function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0.1);
  d.fx = null;
  d.fy = null;
}
