var canvas = document.querySelector('#waves');
var canvas_int = document.querySelector('#waves_int');
var accXCanvas = document.querySelector('#accXDisplay');
var accYCanvas = document.querySelector('#accYDisplay');
var accZCanvas = document.querySelector('#accZDisplay');
var statusText = document.querySelector('#statusText');

var lbIntTime = document.getElementById("intTime");
var lbLaserDist = document.getElementById("laserDistance");
var lbLaserStart = document.getElementById("laserDetectPx");
var lbLaserLength = document.getElementById("laserWaveLength");

var logEn = document.getElementById("logEnabled");
var lbAccX = document.getElementById("accX");
var lbAccY = document.getElementById("accY");
var lbAccZ = document.getElementById("accZ");

var heartRates = [];
const graph_num_data_point = 60;
var accelerometerX = Array(graph_num_data_point).fill(0);
var accelerometerY = Array(graph_num_data_point).fill(0);
var accelerometerZ = Array(graph_num_data_point).fill(0);
var accelerometer_INT1 = Array(graph_num_data_point).fill(0);
var accelerometer_INT2 = Array(graph_num_data_point).fill(0);
var acc_idx = 0;
//var laserStart, laserLenght, sensitivity;
//var chartLenght = 256;
//var distance = Array(3).fill(0);
//var ccd = Array(260).fill(0);
//var ccdDraw = Array(260).fill(0);
var drawCompleteFlag = true; // Flag to indicate if draw is completed (true) or not (false)
var dataFillFlag = false; // Flag to start fill new comming data into the array. 
var nLogs = 0;
const HEADER_SIZE = 6;
const ACCEL_DATA_OFFSET_DATA_HANDLING = 10;
const ACCEL_DATA_SCALE = 5;

statusText.addEventListener('click', function() {
  statusText.textContent = 'Connecting...';
  heartRates = [];
  accelerometerX = [];
  accelerometerY = [];
  accelerometerZ = [];
  tkba.connect()
  .then(() => {statusText.textContent = 'Connected, waitting for data...';})
  .then(() => tkba.startNotificationsAccelerometer().then(handleAccelerometer))
  .catch(error => {
    statusText.textContent = error;
  });
});

function handleAccelerometer(accData) {
  console.log('Accelerometer event settled');
  acc_idx = 0;
  
  accData.addEventListener('characteristicvaluechanged', event => {
    //console.log('New notification - ' + event.target.value.getUint8(0) + ' ' + event.target.value.getUint8(1) + ' ' + event.target.value.getUint8(2));
    //statusText.textContent = event.target.value.getUint8(0) + event.target.value.getUint8(1) + event.target.value.getUint8(2) + event.target.value.getUint8(3) + event.target.value.getUint8(1) + event.target.value.getUint8(4) + event.target.value.getUint8(5);
    statusText.textContent = event.target.byteLenght;
    var accX, accY, accZ;
    var accINT1, accINT2;
    
     var data = [
                  event.target.value.getUint8(11),
                  event.target.value.getUint8(10),
                  event.target.value.getUint8(9),
                  event.target.value.getUint8(8),
      				event.target.value.getUint8(7),
                  event.target.value.getUint8(6),
                  event.target.value.getUint8(5),
                  event.target.value.getUint8(4),
      				event.target.value.getUint8(3),
                  event.target.value.getUint8(2),
                  event.target.value.getUint8(1),
                  event.target.value.getUint8(0)];
                  
      var buf = new ArrayBuffer(12);
      var view = new DataView(buf);
      data.forEach(function (b, i) {
          view.setUint8(i, b);
      });
      accX= view.getFloat32(0);
      accY= view.getFloat32(4);
      accZ= view.getFloat32(8);
      accINT1 = event.target.value.getUint8(12);
      accINT2 = event.target.value.getUint8(13);
      
      
    if(acc_idx>=graph_num_data_point){
      acc_idx=0;
    }
      // Convert to g-scale
     accX = Number(accX/1000).toFixed(2); // divided by 2^15 and multiply by acc scale (2g) then round up to 3 digit
     accY = Number(accY/1000).toFixed(2); // divided by 2^15 and multiply by acc scale (2g) then round up to 3 digit
     accZ = Number(accZ/1000).toFixed(2); // divided by 2^15 and multiply by acc scale (2g) then round up to 3 digit
     
      
      /* Show the acc */
      lbAccX.innerHTML = accX.toString();
      lbAccY.innerHTML = accY.toString();
      lbAccZ.innerHTML = accZ.toString();
      accelerometerX[acc_idx] = accX*ACCEL_DATA_OFFSET_DATA_HANDLING*ACCEL_DATA_SCALE;
      accelerometerY[acc_idx] = accY*ACCEL_DATA_OFFSET_DATA_HANDLING*ACCEL_DATA_SCALE;
      accelerometerZ[acc_idx] = accZ*ACCEL_DATA_OFFSET_DATA_HANDLING*ACCEL_DATA_SCALE;
      accelerometer_INT1[acc_idx] = accINT1;
      
      drawAcc(accX, accXCanvas);
      drawAcc(accY, accYCanvas);
      drawAcc(accZ, accZCanvas);
      if (acc_idx == 0)
      	drawWaves(canvas, _clear =true);
      else
      	drawWaves(canvas);
      	drawWaves_int(canvas_int);
    	acc_idx++;
  });
}

function drawAcc(_acc, _canvas){
	 requestAnimationFrame(() => {
    _canvas.width = parseInt(getComputedStyle(canvas).width);
    _canvas.height = 20;
    
    var context = _canvas.getContext('2d');
    context.clearRect(0, 0, _canvas.width, _canvas.height);

	var grd = context.createLinearGradient(0, 0, _canvas.width, 0);
	grd.addColorStop(0, "blue");
	grd.addColorStop(0.5, "white");
	grd.addColorStop(1, "red");
	
	context.fillStyle = grd;
	rectWidth = Math.abs(_acc)*_canvas.width/4;
	startX = (_acc>0)? _canvas.width/2:(_canvas.width/2-rectWidth);
	context.fillRect(startX, 0, rectWidth, 20);
	context.stroke();
  });
}

function drawWaves(_canvas, _color = '#900c3f', _clear = false ) {
  requestAnimationFrame(() => {
    _canvas.width = parseInt(getComputedStyle(_canvas).width.slice(0, -2)) * devicePixelRatio;
    _canvas.height = 200;//parseInt(getComputedStyle(_canvas).height.slice(0, -2)) * devicePixelRatio;
    
	var offset =  _canvas.height/2;
   var context = _canvas.getContext('2d');
   var margin = 2;
   var max = Math.max(0, Math.round(_canvas.width / 11));
    //var offset = Math.max(0, heartRates.length - max);
    //context.clearRect(0, 0, _canvas.width, _canvas.height);
	context.clearRect(0, 0, _canvas.width, _canvas.height);
	// Zero line
	    context.beginPath();
    context.lineWidth = 2;
    context.lineJoin = 'round';
    context.shadowBlur = '1';
    context.strokeStyle = '#000000';
    context.shadowOffsetY = '1';
    
    var square_side = _canvas.width/graph_num_data_point;
	// CCD 1
	context.moveTo(0, offset);
   context.lineTo( _canvas.width, offset);
	context.stroke();
	
    
    context.beginPath();
    context.lineWidth = 2;
    context.lineJoin = 'round';
    context.shadowBlur = '1';
    context.strokeStyle = '#900c3f';
    context.shadowOffsetY = '1';
    
    var square_side = _canvas.width/graph_num_data_point;
	// CCD 1
	context.moveTo(0, _canvas.height-(accelerometerX[0]+offset)-10);
	for(var i = 1; i<graph_num_data_point ; i++)
 	{
      context.lineTo(square_side * (i), _canvas.height-(accelerometerX[i]+offset));
   }
	context.stroke();
  
 		// CCD 2
 	context.beginPath();
    context.lineWidth = 2;
    context.lineJoin = 'round';
    context.shadowBlur = '2';
 	context.strokeStyle = '#0000ff';
 	context.shadowOffsetY = '1';
 	
   context.moveTo(0, _canvas.height-(accelerometerY[0]+offset)-10);
	for(var i = 1; i<graph_num_data_point ; i++)
 	{
      context.lineTo(square_side * (i), _canvas.height-(accelerometerY[i]+offset));
   }
	context.stroke();
 		// CCD 3
 		context.beginPath();
    context.lineWidth = 2;
    context.lineJoin = 'round';
    context.shadowBlur = '3';
 	context.strokeStyle = '#00ff00';
 	context.shadowOffsetY = '1';
 	
   context.moveTo(0, _canvas.height-(accelerometerZ[0]+offset)-10);
	for(var i = 1; i<graph_num_data_point ; i++)
 	{
      context.lineTo(square_side * (i), _canvas.height-(accelerometerZ[i]+offset));
   }
	context.stroke();
	      
  });
}

function drawWaves_int(_canvas, _color = '#900c3f', _clear = false ) {
  requestAnimationFrame(() => {
    _canvas.width = parseInt(getComputedStyle(canvas).width.slice(0, -2)) * devicePixelRatio;
    _canvas.height = 50;//parseInt(getComputedStyle(_canvas).height.slice(0, -2)) * devicePixelRatio;
    
   var low_edge = 5;
   var high_edge = _canvas.height - low_edge;
   var context = _canvas.getContext('2d');
   var margin = 2;
   var max = Math.max(0, Math.round(_canvas.width / 11));
	context.clearRect(0, 0, _canvas.width, _canvas.height);
	// Zero line
	    context.beginPath();
    context.lineWidth = 2;
    context.lineJoin = 'round';
    context.shadowBlur = '1';
    context.strokeStyle = '#000000';
    context.shadowOffsetY = '1';
    
    var square_side = _canvas.width/graph_num_data_point;
	// INT1
    
    context.beginPath();
    context.lineWidth = 3;
    context.lineJoin = 'round';
    context.shadowBlur = '1';
    context.strokeStyle = '#900c3f';
    context.shadowOffsetY = '1';
    
    var square_side = _canvas.width/graph_num_data_point;
	// CCD 1
	context.moveTo(0, high_edge - (high_edge-low_edge)*accelerometer_INT1[0]);
	for(var i = 1; i<graph_num_data_point ; i++)
 	{
      context.lineTo(square_side * (i), high_edge - (high_edge-low_edge)*accelerometer_INT1[i]);
   }
	context.stroke();
	      
  });
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
//    drawCCD();
    drawWaves();
  }
});

