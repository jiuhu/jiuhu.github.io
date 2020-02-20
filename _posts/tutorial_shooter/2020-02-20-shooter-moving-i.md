---
layout: post
title:  "A Shooting Game - Part I"
categories: shooter
---

## My Ship

My Ship is the player’s representation in a Shooting Game.

Although my ship comes in various forms, the fundamental controls of a shooting game remains always the same. A classic Shooting Game’s control scheme is usually consists of,
- Control stick (or D-pad) for movement,
- A button for shooting, and
- B button for using abilities, such as bomb.

One of the main reasons is the hardware restriction in the early day of gaming industry. More importantly, this simple scheme is sufficient to create an incredible game play for a shooting game. Although modern day gaming controller comes with more buttons, improper design of a shooting game control scheme may introduce unnecessary complexity to the game play. 

In this tutorial series, a simple triangle will be used to represent my ship in every illustration.

![](/assets/sora_shooter/figures/my_triangle.png)

while the fighter aircraft is selected as our **my ship** in the HTML5 demo.

![](/assets/sora_shooter/img/player.png)

<br>

## Ship Movement

Moving the ship is the key of winning in a shooting game.
- For attacking, it is to aim for where to shoot,
- For surviving, it is to avoid incoming attacks.

There folowing are movement controls approach for a 2D based Shooting Game

<br>

### 2-Direction movement

This approach allows the ship to either move vertically or horizontally, depends on the game genre.

For this tutorial series, the view space has its origin set at the top-left corner.

![](/assets/sora_shooter/figures/2_Direction.jpg)

Space invaders and pong are perhaps the most popular 2-Direction movement game.

<br>

### 4-Direction movement

When we combine both vertical and horizontal movement.

![](/assets/sora_shooter/figures/4_Direction.jpg)

Battle City is my favourite among all the games adopting this movement approach.

<br>

### 8-Direction movement

Finally, we belnd the diagonal movement type to further enrich the playability of the game.

![](/assets/sora_shooter/figures/8_Direction.jpg)

Off course in the world of analog controller, we would have a 360 degree movement type to control my ship.

<br>

## The implementation

When the player moved the control stick, the ship coordinates changed. It is as simple as that.

Left-and-right keys control the ship’s horizontal movement and up-and-down keys control its vertical movement. If both are true, it will perform a diagonal movement. Take note that, when a ship is moving towards left side, it shouldn't move to right. This applies to vertical movement as well. 

Thus produces the following pseudocode,

```
if (up)
    y -= speed;
else if (down) 
    y += speed;
if (left)
    x -= speed;
else if (right)
    x += speed;
```

<br>

### Demo

The ship movement speed is defined by the variable speed. You can change the speed of the demo through the drop-down list below.

Control scheme defined,
- Moving up - Up arrow / W
- Moving down - Down arrow / S
- Moving left - Left arrow / A
- Moving right - Right arrow / D

<script src="/assets/sora_shooter/js/common.js"></script>
Speed
<select id="drpSpeed" onclick="shipSpeedAction(this, cvsShipMovementI)">
    <option value="1">1</option>
    <option value="2" selected="selected">2</option>
    <option value="4">4</option>
    <option value="8">8</option>
</select>
<canvas height="360" id="cvsShipMovementI" tabindex="0" width="480">Sorry, canvas not supported by your browser.</canvas>
<script src="/assets/sora_shooter/js/ShipMovementI.js"></script>
<script type="text/javascript">
    function action(drpSpeed) {
        document.getElementById("cvsShipMovementI").focus();
        g_shipMovementI.SetSpeed(parseInt(drpSpeed.value, 10));
    }
</script>

Tested with the New Edge and Chrome.