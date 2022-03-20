import "regenerator-runtime/runtime.js";

// // Test import of an asset
// import webpackLogo from "@/images/webpack-logo.svg";

// Test import of styles
import "@/styles/index.scss";

// // Appending to the DOM
// const logo = document.createElement("img");
// logo.src = webpackLogo;

// const app = document.querySelector("#root");
// app.append(logo);

// import TextToSVG from "text-to-svg";

// async function svgToText(str) {
//   return new Promise((resolve) => {
//     TextToSVG.load("/fonts/Inter.ttf", function (_, textToSVG) {
//       const svg = textToSVG.getSVG(str, {
//         x: 0,
//         y: 0,
//         fontSize: 72,
//         anchor: "top",
//         attributes: {
//           fill: "black",
//           stroke: "black",
//         },
//       });
//       resolve(svg);
//     });
//   });
// }

import {
  Engine,
  Render,
  Runner,
  Common,
  MouseConstraint,
  Mouse,
  Composite,
  Vertices,
  Svg,
  Bodies,
} from "matter-js";
import polyDecomp from "poly-decomp";
import "pathseg";

async function run() {
  // provide concave decomposition support library
  Common.setDecomp(polyDecomp);

  // create engine
  const engine = Engine.create({
      positionIterations: 8,
      gravity: {
        x: (Math.round(Math.random()) * 2 - 1) * 0.1,
        y: (Math.round(Math.random()) * 2 - 1) * 0.1,
      },
    }),
    world = engine.world;

  setInterval(() => {
    engine.gravity.y = (Math.round(Math.random()) * 2 - 1) * 0.01;
    engine.gravity.x = (Math.round(Math.random()) * 2 - 1) * 0.01;
  }, 1440);

  const BACKGROUND_COLOR = "#fff";

  // create renderer
  const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
      width: 1440,
      height: 600,
      wireframes: false,
      background: BACKGROUND_COLOR,
    },
  });

  // add bodies
  if (typeof fetch !== "undefined") {
    const select = function (root, selector) {
      return Array.prototype.slice.call(root.querySelectorAll(selector));
    };

    const loadSvg = function ({ raw, url }) {
      if (raw)
        return new Promise((resolve) => {
          resolve(new window.DOMParser().parseFromString(raw, "image/svg+xml"));
        });

      return fetch(url)
        .then(function (response) {
          return response.text();
        })
        .then(function (raw) {
          return new window.DOMParser().parseFromString(raw, "image/svg+xml");
        });
    };

    const addRoot = (root, offsetX = 0, offsetY = 0) => {
      const vertexSets = select(root, "path").map(function (path) {
        return Vertices.scale(Svg.pathToVertices(path, 40), 1, 1);
      });

      const body = Bodies.fromVertices(
        100 + offsetX,
        200 + offsetY,
        vertexSets,
        {
          render: {
            fillStyle: "#000",
            strokeStyle: "#000",
            lineWidth: 1,
          },
        },
        false,
        false,
        0.01,
        0.01
      );

      console.log("vertexSets", vertexSets, "body", body);

      Composite.add(world, body);
    };

    const phrase = [
      "А",
      null,
      "К",
      "Т",
      "О",
      null,
      "С",
      "Н",
      "Я",
      "Л",
      "question",
    ];

    phrase.forEach((glyph, i) => {
      if (glyph === null) return;
      const path = `/letters/${glyph}.svg`;
      loadSvg({ url: path }).then((root) => addRoot(root, i * 120));
    });

    // loadSvg({ url: "/letters/circle.svg" }).then((root) =>
    //   addRoot(root, 0, 200)
    // );

    Composite.add(
      world,
      Bodies.circle(0, 300, 100, {
        render: {
          fillStyle: "#000",
          strokeStyle: "#000",
          lineWidth: 1,
        },
      })
    );

    // ["/svg.svg"].forEach(function (path, i) {
    //   loadSvg({ url: path }).then(function (root) {
    //     // const color = Common.choose([
    //     //   "#f19648",
    //     //   "#f5d259",
    //     //   "#f55a3c",
    //     //   "#063e7b",
    //     //   "#ececd1",
    //     // ]);
    //   });
    // });
  } else {
    Common.warn("Fetch is not available. Could not load SVG.");
  }

  const PADDING = 30;

  Composite.add(world, [
    Bodies.rectangle(400, 0, 1440, PADDING, {
      isStatic: true,
      render: { fillStyle: BACKGROUND_COLOR },
    }),
    Bodies.rectangle(400, 600, 1440, PADDING, {
      isStatic: true,
      render: { fillStyle: BACKGROUND_COLOR },
    }),
    Bodies.rectangle(1440, 300, PADDING, 600, {
      isStatic: true,
      render: { fillStyle: BACKGROUND_COLOR },
    }),
    Bodies.rectangle(0, 300, PADDING, 600, {
      isStatic: true,
      render: { fillStyle: BACKGROUND_COLOR },
    }),
  ]);

  // add mouse control
  const mouse = Mouse.create(render.canvas),
    mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false,
        },
      },
    });

  Composite.add(world, mouseConstraint);

  // keep the mouse in sync with rendering
  render.mouse = mouse;

  // fit the render viewport to the scene
  Render.lookAt(render, {
    min: { x: 0, y: 0 },
    max: { x: 1440, y: 600 },
  });
  // create runner
  const runner = Runner.create();
  Runner.run(runner, engine);

  setTimeout(() => {
    Render.run(render);
  }, 1000);
}

window.addEventListener("load", run());
