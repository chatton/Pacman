# Pacman
Pacman clone made using HTML5 Canvas and JS

# Elements included.

1. User Interaction
The user can move pacman with the arrow keys.

2. Basic Collision Detection.
Pacman collides with the walls and with the power ups he can collect and the ghosts.

3. Cartesian to Polar Co-ordinates.

When drawing pacman, there is Cartesian to Polar co-ordinate transformations.

4. Transformation

The background image scales using transform.

5. Illustration of Movement, Scaling and Rotation
- Pacman and the ghosts all move.
- Scaling is used to flip Pacman horizontally when he is facing left.
- Rotation is used when pacman changes direction.

6. Multiple objects moving.

Pacman as well as all the ghosts are all moving simulataneously.

7. Sprites

The background image is a sprite.

# Advanced

8. Collision reactions.

- Sounds play on collisions.    
- Pacman cannot move through walls.
- If pacman collides with a ghost, if the ghost is scared the ghost dies, otherwise pacman loses a life.
- Pacman can collect 2 different types of pellets which will activate an effect and disappear on collection.

# Additional Features.

- You can provide your own file to create a level to play. The best board size is between 10x10 and a 20x20 grid size.
- Use the following characters to build a level.
 \# - Wall
 S - Pacman's starting position (only incude one)
 . - A pellet to pick up
 G - A ghost
 P - A Power Pellet, when pacman picks one up, the ghosts can be eaten for the next 15 seconds.
 H - A Path Pellete, this will highlight each Ghost's current path.

- The ghosts have path finding - this is implemented using a BFS algorithm and by representing the level as a graph of nodes.
- When you collect a "Path Pellet", the current paths of the ghosts will be drawn.
- If a ghost gets near Pacman (Using the Manhattan distance as a metric), they will switch destination to go towards Pacman.
- Initially, a ghost will have a random destination, when they reach it, they will pick a new destination and move towards that.
- Sounds play on collisions, and certain events. Collisions, victory, defeat etc.