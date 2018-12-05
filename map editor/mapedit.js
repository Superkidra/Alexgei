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
		var material= new THREE.MeshBasicMaterial({color: image, side: THREE.BackSide});
	}
	else if(typeof image==="string")
	{
		var texture=new THREE.TextureLoader().load(image);
		texture.flipY= false;
		var material= new THREE.MeshBasicMaterial({map: texture, side: THREE.BackSide});
	}
	else
	{
		var material= image;
		console.log("y");
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
function Tilesheet(path, size, cb)
{
	var tiles=[];
	var i= new Image();
	i.onload= function()
	{
		for(let y=0; y<size.y; y++)
		{
			for(let x=0; x<size.x; x++)
			{
				var c= document.createElement("canvas");
				c.width= 16;
				c.height= 16;
				var ctx= c.getContext("2d");
				ctx.drawImage(i, x*16, y*16, 16, 16, 0, 0, 16, 16);
				var t= new THREE.CanvasTexture(c);
				t.flipY= false;
				tiles.push(new THREE.MeshBasicMaterial({map: t, side: THREE.BackSide}));
			}
		}
		cb(tiles)
	}
	i.src= path;
}
function main()
{
	var fr= new FileReader();
	fr.onload= function(e)
	{
		var path= e.target.result;
		console.log(path);
		var tilesheet_size={};
		tilesheet_size.x=parseInt(document.getElementById("tilesheet_x").value);
		tilesheet_size.y= parseInt(document.getElementById("tilesheet_y").value);
		Tilesheet(path, tilesheet_size, function(tiles)
		{
			let form= document.getElementById("tilesheet");
			form.parentNode.removeChild(form);
			// var selector_scene= new THREE.Scene();
			// var selector_renderer= new THREE.WebGLRenderer()
			// selector_renderer.domElement.style.width= "256px";
			// selector_renderer.domElement.style.height= "256px";
			// selector_renderer.setSize(256, 256);
			// document.body.appendChild(selector_renderer.domElement);
			// var selector_camera= new THREE.OrthographicCamera(0, 256, 0, 256, 1, 1000);
			// selector_camera.position.z= 1;
			// selector_scene.add(selector_camera);
			var current_color= 0x000000;
			var color_selector= document.createElement("input");
			color_selector.type= "color";
			color_selector.onchange= function(e)
			{
				current_color= color_selector.value.replace('#', "0x");
			}
			document.body.appendChild(color_selector);
			document.body.appendChild(document.createElement("br"));
			var map_scene= new THREE.Scene();
			var map_renderer= new THREE.WebGLRenderer();
			map_renderer.domElement.style.width= "100%";
			map_renderer.domElement.style.height= "100%";
			map_renderer.domElement.style.display= "block";
			map_renderer.setSize(window.innerWidth, window.innerHeight)
			document.body.appendChild(map_renderer.domElement);
			var map_camera= new THREE.OrthographicCamera(0, 640, 0, 480, 1, 1000);
			map_camera.position.z = 1;
			map_scene.add(map_camera);
			var mouse= new THREE.Vector2()
			map_renderer.domElement.addEventListener("mousemove", function(e)
			{
				mouse.set(Math.floor((e.clientX/map_renderer.domElement.width)*640), Math.floor((e.clientY/map_renderer.domElement.height)*480));
			});
			map_renderer.domElement.addEventListener("click", function()
			{
				var b= {x: Math.floor(mouse.x/16), y: Math.floor(mouse.y/16)};
				var s= createSprite(b.x*16, b.y*16, 16, 16, tiles[1]);
				console.log(b.x.toString(), b.y.toString(), mouse.x.toString(), mouse.y.toString());
				s.color= current_color;
				map_scene.add(s);
			});
			function render()
			{
				//Main loop
				map_renderer.render(map_scene, map_camera);
				// selector_renderer.render(selector_scene, selector_camera)
				requestAnimationFrame(render);
			}
			render();
		});
	}
	fr.readAsDataURL(document.getElementById("tilesheet_file").files[0]);
}