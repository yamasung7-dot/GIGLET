/* GIGLET Lighting 3.0.0 - regular viewport lighting with a billboard control. */
(function () {
const ID="giglet_render", SIZE=4, COLOR=0xffffff;
let menuAction,createAction,colorAction,sizeAction,positionAction,removeAction,colorDialog;
let light=null,billboard=null,billboardMaterial=null,lightSize=SIZE,lightColor=COLOR;
Plugin.register(ID,{
 title:"GIGLET Lighting",author:"Olive",
 description:"Create and control a regular point light with a billboard in the Blockbench viewport.",
 version:"3.0.0",min_version:"4.8.0",variant:"both",
 onload(){
  createAction=new Action("giglet_create_light",{name:"Create Light Billboard",icon:"lightbulb",click:createLight});
  colorAction=new Action("giglet_light_color",{name:"Light Color",icon:"colorize",condition:()=>!!light,click:openColorMenu});
  sizeAction=new Action("giglet_light_size",{name:"Light Size",icon:"aspect_ratio",condition:()=>!!light,click:changeSize});
  positionAction=new Action("giglet_light_position",{name:"Light Position",icon:"open_with",condition:()=>!!light,click:changePosition});
  removeAction=new Action("giglet_remove_light",{name:"Remove Light",icon:"delete",condition:()=>!!light,click:removeLight});
  menuAction=new Action("giglet_lighting",{name:"GIGLET Lighting",icon:"lightbulb_outline",click:e=>new Menu("giglet_lighting_menu",[createAction,colorAction,sizeAction,positionAction,removeAction]).open(e&&e.target?e.target:document.body)});
  MenuBar.addAction(menuAction,"tools");
 },
 onunload(){removeLight();if(colorDialog)colorDialog.hide();[menuAction,createAction,colorAction,sizeAction,positionAction,removeAction].forEach(a=>{if(a)a.delete()})}
});
function createLight(){
 if(light){Blockbench.showQuickMessage("GIGLET light already exists.");return}
 if(typeof Canvas==="undefined"||!Canvas.scene){Blockbench.showQuickMessage("GIGLET could not access the Blockbench viewport scene.");return}
 lightSize=SIZE;lightColor=COLOR;
 light=new THREE.PointLight(lightColor,1,Math.max(20,lightSize*20),2);
 light.position.set(8,10,8);light.no_export=true;updateLight();
 billboardMaterial=new THREE.SpriteMaterial({color:lightColor,transparent:true,opacity:.82,depthWrite:false,depthTest:false});
 billboard=new THREE.Sprite(billboardMaterial);billboard.name="GIGLET Light Billboard";
 billboard.scale.set(lightSize,lightSize,1);billboard.position.copy(light.position);billboard.renderOrder=1000;billboard.no_export=true;
 billboard.userData.giglet_light=light;light.userData.giglet_billboard=billboard;
 Canvas.scene.add(light);Canvas.scene.add(billboard);
 Blockbench.showQuickMessage("GIGLET light billboard created.");
}
function updateLight(){
 if(!light)return;
 const area=Math.max(.01,lightSize*lightSize),power=Math.min(100000,area*12);
 if("power" in light)light.power=power;else light.intensity=Math.min(10,power/100);light.distance=Math.max(20,lightSize*20);light.decay=2;light.color.setHex(lightColor);
 if(billboard){billboard.position.copy(light.position);billboard.scale.set(lightSize,lightSize,1)}
 if(billboardMaterial)billboardMaterial.color.setHex(lightColor);
}
function openColorMenu(e){
 const colors=[["White",0xffffff],["Warm White",0xffd7a8],["Cool White",0xc9ddff],["Red",0xff4040],["Orange",0xff8a3d],["Yellow",0xffe44d],["Green",0x57d66b],["Cyan",0x43d9ff],["Blue",0x4f7cff],["Purple",0xa66cff],["Pink",0xff6fcf]];
 const items=colors.map(c=>({name:c[0],icon:"fiber_manual_record",click:()=>setColor(c[1])}));
 items.push({name:"Custom Color...",icon:"colorize",click:openCustomColor});
 new Menu("giglet_light_colors",items).open(e&&e.target?e.target:document.body);
}
function setColor(c){if(!light)return;lightColor=c;updateLight()}
function openCustomColor(){
 if(!colorDialog)colorDialog=new Dialog({id:"giglet_light_color_dialog",title:"GIGLET Light Color",form:{color:{label:"Color",type:"color",value:"#"+lightColor.toString(16).padStart(6,"0")}},onConfirm(form){if(!light)return;const v=String(form.color||"").replace("#","");if(/^[0-9a-fA-F]{6}$/.test(v))setColor(parseInt(v,16))}});
 colorDialog.show();
}
function changeSize(){
 if(!light)return;
 new Dialog({id:"giglet_light_size_dialog",title:"GIGLET Light Size",form:{size:{label:"Billboard Size",type:"number",value:lightSize,min:.1,max:100,step:.1}},onConfirm(form){if(!light)return;const v=Number(form.size);if(Number.isFinite(v)){lightSize=Math.max(.1,Math.min(100,v));updateLight()}}}).show();
}
function changePosition(){
 if(!light)return;
 new Dialog({id:"giglet_light_position_dialog",title:"GIGLET Light Position",form:{x:{label:"X",type:"number",value:light.position.x,step:.1},y:{label:"Y",type:"number",value:light.position.y,step:.1},z:{label:"Z",type:"number",value:light.position.z,step:.1}},onConfirm(form){if(!light)return;const x=Number(form.x),y=Number(form.y),z=Number(form.z);if([x,y,z].every(Number.isFinite)){light.position.set(x,y,z);if(billboard)billboard.position.copy(light.position)}}}).show();
}
function removeLight(){
 if(billboard){if(billboard.parent)billboard.parent.remove(billboard);if(billboardMaterial)billboardMaterial.dispose()}
 if(light&&light.parent)light.parent.remove(light);billboard=null;billboardMaterial=null;light=null;
}
})();