The goal here is to design an architecture for the graphing calculator that makes it possible to add new types of math objects easily, ideally using some sort of plugin system in the future.

The biggest design opinion in the graphing calculator is that **there's a one-to-one correspondence between items in the sidebar and items in the 3D world**. This is a well-known pattern (in graphing calculators like Desmos but also in 2D and 3D art/world-building tools), so it is battle-tested. It's also pretty flexible; in unusual cases, a sidebar item could correspond to a bunch of world items or cause some other side effect or interesting behavior.

Each type of math object needs to specify:

- The metadata format (which fields to specify and what their types are)
- The UI for editing the object's fields
- The 3D content to display on the graph

Additionally, different types of math objects must know how to interact in the following ways:

- It should be possible to convert a math object into other, compatible types while preserving as much information as possible (color, etc.)
- Math objects which are primarily based on math text input (expressions, equations, vectors, points, etc.) should automatically convert from one type to another when the main math field is unfocused

# Communicating between objects

Every object has settings and a view. It can also perform asynchronous (possibly long, off-thread) computations based on the settings, and the results of those computations will be stored and passed into the view.

Additionally, while each object is performing its computations, it can do the following things:

- Report how many dimensions (1D, 2D, or 3D) it can be graphed over
- Report which variables it depends on
- Assign variable values (and functions, etc.)

This allows the calculator to show UI that...

- Only allows choosing a number of dimensions (and choice of axes) that works for all objects
- Reports undefined variables and helps the user define them
- Identifies and displays circular dependency errors

It also allows the calculator the perform the following optimizations...

- Only recompute math when object settings or input variable values change
