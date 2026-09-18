/*
 * GIGLET Lighting 5.0.0
 * Lighting foundation adapted from the original Blockbench Light Plug,
 * rebuilt around a native movable Blockbench Locator.
 */
(function () {
const ID="giglet_render";
const DEFAULT_SIZE=4;
const DEFAULT_COLOR=0xffffff;

let menuAction,createAction,colorAction,sizeAction,removeAction;
let light=null,billboard=null,billboardMaterial=null,controller=null;
let lightSize=DEFAULT_SIZE,lightColor=DEFAULT_COLOR;

function hasScene(){
 return typeof Canvas!=="undefined" && !!Canvas.scene && typeof THREE!=="undefined";
}

function getModelBounds(){
 if(!hasScene()) return null;
 const box=new THREE.Box3();
 let found=false;
 Canvas.scene.traverse(object=>{
  if(object.isMesh && object.visible && !object.userData?.giglet_light){
   box.expandByObject(object);
   found=true;
  }
 });
 if(!found||box.isEmpty()) return null;
 const center=box.getCenter(new THREE.Vector3());
 const size=box.getSize(new THREE.Vector3());
 return {box,center,size,radius:Math.max(size.length()*0.5,1)};
}

function configureLightFromModel(){
 if(!light) return;
 const bounds=getModelBounds();
 const radius=bounds?bounds.radius:16;
 light.distance=Math.max(20,radius*8,lightSize*20);
 light.decay=2;
}

function createLight(){
 if(light){
  Blockbench.showQuickMessage("GIGLET light already exists.");
  return;
 }
 if(!hasScene()){
  Blockbench.showQuickMessage("GIGLET could not access the Blockbench viewport scene.");
  return;
 }
 if(typeof Locator==="undefined"){
  Blockbench.showQuickMessage("GIGLET requires Blockbench locators.");
  return;
 }

 lightSize=DEFAULT_SIZE;
 lightColor=DEFAULT_COLOR;

 // Native Blockbench object: normal selection, transform controls and undo support.
 controller=new Locator({
  name:"GIGLET Light",
  position:[8,10,8],
  visibility:true,
  export:false
 }).init();

 controller.addTo(Outliner.ROOT);
 controller.export=false;
 controller.createUniqueName();

 // Regular Three.js point light. This is intentionally simple and is the
 // first lighting primitive we build from the old Light Plug foundation.
 light=new THREE.PointLight(lightColor,1,20,2);
 light.no_export=true;
 light.userData.giglet_light=true;
 light.userData.giglet_controller=controller;

 billboardMaterial=new THREE.SpriteMaterial({
  color:lightColor,
  transparent:true,
  opacity:.82,
  depthWrite:false,
  depthTest:false
 });

 billboard=new THREE.Sprite(billboardMaterial);
 billboard.name="GIGLET Light Billboard";
 billboard.scale.set(lightSize,lightSize,1);
 billboard.renderOrder=1000;
 billboard.no_export=true;
 billboard.userData.giglet_light=true;

 controller.mesh.add(billboard);

 if(controller.mesh.sprite){
  controller.mesh.sprite.material.transparent=true;
  controller.mesh.sprite.material.opacity=0;
 }

 controller.userData.giglet_light=light;
 controller.userData.giglet_billboard=billboard;

 Canvas.scene.add(light);
 syncLight();
 controller.select();
 Blockbench.showQuickMessage("GIGLET light created — move it like a model.");
}

function syncLight(){
 if(!light||!controller) return;

 if(typeof Locator!=="undefined"&&!Locator.all.includes(controller)){
  removeLight(false);
  return;
 }

 const world=controller.getWorldCenter();
 light.position.copy(world);
 configureLightFromModel();
 updateLightSettings();
 updateBillboard();
}

function updateLightSettings(){
 if(!light) return;

 // Same basic size→power idea as the original Light Plug:
 // larger light representation produces a stronger light.
 const area=Math.max(.01,lightSize*lightSize);
 const power=Math.min(100000,area*12);

 if("power" in light) light.power=power;
 else light.intensity=Math.min(10,power/100);

 light.color.setHex(lightColor);
}

function updateBillboard(){
 if(!billboard) return;
 billboard.scale.set(lightSize,lightSize,1);
 if(billboardMaterial) billboardMaterial.color.setHex(lightColor);
}

function openColorMenu(e){
 const colors=[
  ["White",0xffffff],["Warm White",0xffd7a8],["Cool White",0xc9ddff],
  ["Red",0xff4040],["Orange",0xff8a3d],["Yellow",0xffe44d],
  ["Green",0x57d66b],["Cyan",0x43d9ff],["Blue",0x4f7cff],
  ["Purple",0xa66cff],["Pink",0xff6fcf]
 ];
 const items=colors.map(c=>({name:c[0],icon:"fiber_manual_record",click:()=>setColor(c[1])}));
 items.push({name:"Custom Color...",icon:"colorize",click:openCustomColor});
 new Menu("giglet_light_colors",items).open(e&&e.target?e.target:document.body);
}

function setColor(color){
 if(!light) return;
 lightColor=color;
 updateLightSettings();
 updateBillboard();
}

let colorDialog=null;
function openCustomColor(){
 const current="#"+lightColor.toString(16).padStart(6,"0");
 if(!colorDialog){
  colorDialog=new Dialog({
   id:"giglet_light_color_dialog",
   title:"GIGLET Light Color",
   form:{color:{label:"Color",type:"color",value:current}},
   onConfirm(form){
    if(!light) return;
    const value=String(form.color||"").replace("#","");
    if(/^[0-9a-fA-F]{6}$/.test(value)) setColor(parseInt(value,16));
   }
  });
 }
 colorDialog.show();
}

function changeSize(){
 if(!light) return;
 new Dialog({
  id:"giglet_light_size_dialog",
  title:"GIGLET Light Size",
  form:{size:{label:"Billboard Size",type:"number",value:lightSize,min:.1,max:100,step:.1}},
  onConfirm(form){
   if(!light) return;
   const value=Number(form.size);
   if(Number.isFinite(value)){
    lightSize=Math.max(.1,Math.min(100,value));
    syncLight();
   }
  }
 }).show();
}

function removeLight(removeController=true){
 if(controller&&controller.mesh&&billboard&&billboard.parent===controller.mesh){
  controller.mesh.remove(billboard);
 }
 if(removeController&&controller&&typeof Locator!=="undefined"&&Locator.all.includes(controller)&&controller.remove){
  controller.remove();
 }
 if(billboardMaterial) billboardMaterial.dispose();
 if(light&&light.parent) light.parent.remove(light);

 billboard=null;
 billboardMaterial=null;
 controller=null;
 light=null;
}

function registerActions(){
 createAction=new Action("giglet_create_light",{
  name:"Create Light Billboard",icon:"lightbulb",click:createLight
 });
 colorAction=new Action("giglet_light_color",{
  name:"Light Color",icon:"colorize",condition:()=>!!light,click:openColorMenu
 });
 sizeAction=new Action("giglet_light_size",{
  name:"Light Size",icon:"aspect_ratio",condition:()=>!!light,click:changeSize
 });
 removeAction=new Action("giglet_remove_light",{
  name:"Remove Light",icon:"delete",condition:()=>!!light,click:removeLight
 });

 menuAction=new Action("giglet_lighting",{
  name:"GIGLET Lighting",icon:"lightbulb_outline",
  click:e=>new Menu("giglet_lighting_menu",[
   createAction,colorAction,sizeAction,removeAction
  ]).open(e&&e.target?e.target:document.body)
 });
 MenuBar.addAction(menuAction,"tools");
}

Plugin.register(ID,{
 title:"GIGLET Lighting",
 author:"Olive",
 description:"Regular Blockbench lighting built from the original Light Plug lighting foundation.",
 version:"5.0.0",
 min_version:"4.8.0",
 variant:"both",

 onload(){
  registerActions();
  Blockbench.on("render_frame",syncLight);
 },
 onunload(){
  Blockbench.removeListener("render_frame",syncLight);
  removeLight();
  if(colorDialog) colorDialog.hide();
  [menuAction,createAction,colorAction,sizeAction,removeAction].forEach(action=>{
   if(action) action.delete();
  });
  menuAction=createAction=colorAction=sizeAction=removeAction=null;
  colorDialog=null;
 }
});
})();