function RGBA_CSS(r, g, b, a)
{
	return "rgba("+r.toString()+','+g.toString()+','+b.toString()+','+a.toString()+')';
}
function CircularIterator(base)
{
	this.array= base;
	this.currentIndex= -1;
	this.current= function()
	{
		this. currentIndex+= 1;
		if(this.currentIndex>=this.array.length)
		{
			this.currentIndex= 0;
		}
		return this.array[this.currentIndex];
	}
	return this;
}
scene= new THREE.Scene();
var renderer= new THREE.WebGLRenderer();
// var camera = new THREE.PerspectiveCamera( 90, window.innerWidth/window.innerHeight, 1, 1000 );
// var camera= new THREE.OrthographicCamera(-400, 400, -300, 300, 1, 1000);
var camera= new THREE.OrthographicCamera(0, 800, 0, 600, 1, 1000);
camera.position.z = 1;
scene.add(camera);
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement);
function createText(font, color, fillColor, msg)
{
	var canvas= document.createElement("canvas");
	var ctx= canvas.getContext("2d");
	ctx.font= font;
	height= ctx.measureText('M').width;
	width= ctx.measureText(msg).width;
	var canvas= document.createElement("canvas");
	canvas.width= width;
	canvas.height= height*1.4;
	var ctx= canvas.getContext("2d");
	ctx.fillStyle= fillColor;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.font= font;
	ctx.fillStyle= color;
	ctx.fillText(msg, 0, canvas.height/4*3);
	data= canvas.toDataURL();
	return {image: data, height: canvas.height, width: canvas.width};
}
material = undefined;
function createSprite(posX, posY, sizeX, sizeY, image)
{
	var square= new THREE.PlaneGeometry(1, 1);
	square.translate(0.5, 0.5, 0);
	if(typeof image==="number")
	{
		var material= new THREE.MeshBasicMaterial({color: image, side: THREE.DoubleSide});
	}
	else
	{
		var texture=new THREE.TextureLoader().load(image);
		texture.flipY= false;
		var material= new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide});
		console.log("done");
	}
	var mesh= new THREE.Mesh(square, material);
	mesh.scale.set(sizeX, sizeY, 1);
	mesh.position.set(posX, posY, 0);
	return mesh;
}
function Pen(font, color, fillColor)
{
	this.font= font;
	this.color= color;
	this.fillColor= fillColor;
	this.write= function(posX, posY, width, height, text)
	{
		let t= createText(this.font, this.color, this.fillColor, text);
		return createSprite(posX, posY, width, height, t.image);
	}
	return this;
}
function vts(v)
{
	return '('+v.x.toString()+", "+v.y.toString()+", "+v.z.toString()+')';
}
function loadMap(mapName)
{
	p= new Pen("800px Comic Sans MS", "#0000FF", RGBA_CSS(0,0,0,0));
	loadingimages= new CircularIterator(
		[
			p.write(300, 225, 200, 150, "Loading"),
			p.write(300, 225, 200, 150, "Loading."),
			p.write(300, 225, 200, 150, "Loading.."),
			p.write(300, 225, 200, 150, "Loading..."),
		]);
	setInterval(function()
	{
		if(this.i) scene.remove(this.i);
		this.i= loadingimages.current();
		console.log(vts(this.i.position));
		scene.add(this.i);
	}, 1000);
	/*
	xhr= new XMLHttpRequest();
	xhr.
	*/
}
var p= new Pen("800px Comic Sans MS", "#0000FF", RGBA_CSS(255, 0, 0, 255));
var startButton= /*p.write(200, 150, 400, 300, "Startu");*/createSprite(200, 150, 400, 300, createText("300px Comic Sans MS", "#0000FF", RGBA_CSS(255, 0, 0, 255), "Start").image);
scene.add(startButton);
// var s1tartButton= createSprite(200, 300, 400, 300, createText("300px Comic Sans MS", "#0000FF", RGBA_CSS(255, 0, 0, 255), "Startug").image);
// scene.add(s1tartButton);
// var s2tartButton= createSprite(200, 450, 400, 300, createText("300px Comic Sans MS", "#0000FF", RGBA_CSS(255, 0, 0, 255), "Startug").image);
// scene.add(s2tartButton);
// var s1tartButton= createSprite(200, 150, 400, 300, 0x00FF00);
// scene.add(s1tartButton);
var States= {Menu: 0, Game: 1};
var State= States.Menu;
var ndcMouse= new THREE.Vector2()
renderer.domElement.addEventListener("mousemove", function(e)
{
	ndcMouse.set((e.clientX/renderer.domElement.width)*2-1,(e.clientY/renderer.domElement.height)*2-1);
});
renderer.domElement.addEventListener("click", function()
{
	var rc= new THREE.Raycaster();
	rc.setFromCamera(ndcMouse, camera);
	if(State==States.Menu)
	{
		if(rc.intersectObject(startButton).length)
		{
			State= States.Game;
			scene.remove(startButton);
			loadMap();
		}
	}
});
var clock= THREE.Clock();
function render()
{
	//Main loop
	renderer.render(scene, camera);
	requestAnimationFrame(render);
}
render();