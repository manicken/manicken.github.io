// Example design. Included by index.html, it adds itself to the global ExampleDesigns list,
// listed in the menu (top right) under Examples, in the order the files are included.
(globalThis.ExampleDesigns = globalThis.ExampleDesigns || []).push({
    name: "EmptyNewProject",
    label: "Empty New Project",
    description: "this is just a clean and empty project",
    dividerAfter: true,
    design: []
});
