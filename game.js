var scene= new THREE.Scene();
var renderer= new THREE.WebGLRenderer();
// var camera = new THREE.PerspectiveCamera( 90, window.innerWidth/window.innerHeight, 1, 1000 );
var camera= new THREE.OrthographicCamera(-400, 400, -300, 300, 1, 1000);
camera.position.z = 1;
scene.add(camera);
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement);
var square= new THREE.PlaneGeometry(1, 1);
square.translate(-0.5, -0.5, 0);
function createText(font, color, msg)
{
	var canvas= document.createElement("canvas");
	var ctx= canvas.getContext("2d");
	ctx.font= font;
	height= ctx.measureText('M').width;
	width= ctx.measureText(msg).width;
	var canvas= document.createElement("canvas");
	canvas.width= width;
	canvas.height= height;
	var ctx= canvas.getContext("2d");
	ctx.font= font;
	ctx.fillStyle= color;
	ctx.fillText(msg, 0, height-20);
	data= canvas.toDataURL();
	return data;
}
material = undefined;
function createSprite(posX, posY, sizeX, sizeY, image)
{
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
	mesh.translateX(posX);
	mesh.translateY(posY);
	return mesh;
}
var startButton= createSprite(200, 150, 400, 300, createText("300px Comic Sans MS", "#0000FF", "Startu"));
scene.add(startButton);
ndcMouse= new THREE.Vector2()
renderer.domElement.addEventListener("mousemove", function(e)
{
	ndcMouse.set((e.clientX/renderer.domElement.width)*2-1,(e.clientY/renderer.domElement.height)*2-1);
});
renderer.domElement.addEventListener("click", function()
{
	var rc= new THREE.Raycaster();
	rc.setFromCamera(ndcMouse, camera);
	if(rc.intersectObject(startButton).length) alert("started");
});
var clock= THREE.Clock();
function render()
{
	//Main loop
	requestAnimationFrame(render);
	renderer.render(scene, camera);
}
render();