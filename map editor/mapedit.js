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
		tiles.x= size.x;
		tiles.y= size.y;
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
			var selector_scene= new THREE.Scene();
			var selector_renderer= new THREE.WebGLRenderer()
			selector_renderer.domElement.style.width= (16*tiles.x).toString()+'px';
			selector_renderer.domElement.style.height= (16*tiles.y).toString()+'px';
			selector_renderer.domElement.width= 16*tiles.x;
			selector_renderer.domElement.height= 16*tiles.y;
			selector_renderer.setSize(16*tiles.x, 16*tiles.y);
			document.getElementById("controls").insertBefore(selector_renderer.domElement, document.getElementById("controls").childNodes[0]);
			document.getElementById("controls").hidden= false;
			var selector_camera= new THREE.OrthographicCamera(0, 256, 0, 256, 1, 1000);
			selector_camera.position.z= 1;
			selector_scene.add(selector_camera);
			let t= new THREE.TextureLoader().load(path);
			t.flipY= false;
			var selector_picker= createSprite(0, 0, 16*tiles.x, 16*tiles.y, new THREE.MeshBasicMaterial({side: THREE.BackSide, map: t}));
			selector_scene.add(selector_picker);
			var selector= new THREE.Vector2(0, 0);
			var selected_tile= 0;
			selector_renderer.domElement.addEventListener("mousemove", function(e)
			{
				selector.set(Math.floor(e.offsetX/16), Math.floor(e.offsetY/16));
			});
			selector_renderer.domElement.addEventListener("click", function()
			{
				selected_tile= (tiles.x*selector.y)+selector.y;
			});
			var current_color= 0xFFFFFF;
			var color_selector= document.getElementById("color_selector");
			color_selector.onchange= function(e)
			{
				current_color= parseInt(color_selector.value.replace('#', "0x"));
				selector_picker.material.color.set(current_color);
			}
			var triggers= {};
			var npcs= {};
			var items= {};
			var map_scene= new THREE.Scene();
			var map_renderer= new THREE.WebGLRenderer();
			map_renderer.domElement= document.body.appendChild(map_renderer.domElement);
			map_renderer.domElement.style.width= "100%";
			map_renderer.domElement.style.height= "100%";
			map_renderer.domElement.style.display= "block";
			map_renderer.domElement.width= map_renderer.domElement.clientWidth;
			map_renderer.domElement.height= map_renderer.domElement.clientHeight;
			map_renderer.setSize(map_renderer.domElement.width, map_renderer.domElement.height)
			var map_camera= new THREE.OrthographicCamera(0, 640, 0, 480, 1, 1000);
			map_camera.position.z = 1;
			map_scene.add(map_camera);
			var mouse= new THREE.Vector2()
			map_renderer.domElement.addEventListener("mousemove", function(e)
			{
				mouse.set(Math.floor((e.offsetX/map_renderer.domElement.width)*640), Math.floor((e.offsetY/map_renderer.domElement.height)*480));
			});
			map_renderer.domElement.addEventListener("click", function()
			{
				var b= {x: Math.floor(mouse.x/16), y: Math.floor(mouse.y/16)};
				if(document.querySelector('input[name="mode"]:checked').value=="edit")
				{
					let prev= map_scene.getObjectByProperty("position", new THREE.Vector3(b.x*16, b.y*16, 1));
					if(prev)
					{
						if(prev.material.name=="dispose") prev.material.dispose();
						map.remove(prev);
					}
					if(current_color==0xFFFFFF) var s= createSprite(b.x*16, b.y*16, 16, 16, tiles[selected_tile]);
					else
					{
						let t= tiles[selected_tile].clone();
						t.color.set(current_color);
						var s= createSprite(b.x*16, b.y*16, 16, 16, t);
					}
					console.log(b.x.toString(), b.y.toString(), mouse.x.toString(), mouse.y.toString());
					map_scene.add(s);
				}
				else
				{
					let v= document.getElementById("value_text").value;
					let mode= document.querySelector('input[name="mode"]:checked').value;
					if(mode=="trigger")
					{
						if(triggers[b]) triggers[b].push(v);
						else triggers[b]= [v];
					}
					else if(mode=="npc") npcs[b]= v;
					else if(mode=="item") items[b]= v;
					else if(mode=="clear")
					{
						triggers[b]= undefined;
						npcs[b]= undefined;
						items[b]= undefined;
					}
					else console.error("How did we get here");
				}
			});
			function render()
			{
				//Main loop
				map_renderer.render(map_scene, map_camera);
				selector_renderer.render(selector_scene, selector_camera)
				requestAnimationFrame(render);
			}
			render();
		});
	}
	fr.readAsDataURL(document.getElementById("tilesheet_file").files[0]);
}