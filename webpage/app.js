var canvas = document.querySelector('#waves');
var canvas_int = document.querySelector('#waves_int');
var accXCanvas = document.querySelector('#accXDisplay');
var accYCanvas = document.querySelector('#accYDisplay');
var accZCanvas = document.querySelector('#accZDisplay');
var statusText = document.querySelector('#statusText');
var startLog = document.querySelector('#btn_log');

var fileName = document.getElementById("tb_fileName");
var lbIntTime = document.getElementById("intTime");
var lbLaserDist = document.getElementById("laserDistance");
var lbLaserStart = document.getElementById("laserDetectPx");
var lbLaserLength = document.getElementById("laserWaveLength");

var logEn = document.getElementById("logEnabled");
var lbAccX = document.getElementById("accX");
var lbAccY = document.getElementById("accY");
var lbAccZ = document.getElementById("accZ");

var cbTemp = document.getElementById("cb_log_temp");
var cbCap = document.getElementById("cb_log_cap");
var cbAcc = document.getElementById("cb_log_acc");
var cbInt = document.getElementById("cb_log_int");
var cbFuelGauge = document.getElementById("cb_log_fuel_gauge");

var heartRates = [];
const graph_num_data_point = 60;
const packet_size = 67;
var pkg_idx = 0;

var capacitor_1 = Array(graph_num_data_point).fill(0);
var capacitor_2 = Array(graph_num_data_point).fill(0);
var capacitor_3 = Array(graph_num_data_point).fill(0);
var capacitor_4 = Array(graph_num_data_point).fill(0);

var temperature_1 = Array(graph_num_data_point).fill(0);
var temperature_2 = Array(graph_num_data_point).fill(0);
var temperature_3 = Array(graph_num_data_point).fill(0);
var temperature_4 = Array(graph_num_data_point).fill(0);

var accelerometerX = Array(graph_num_data_point).fill(0);
var accelerometerY = Array(graph_num_data_point).fill(0);
var accelerometerZ = Array(graph_num_data_point).fill(0);
var accelerometer_INT1 = Array(graph_num_data_point).fill(0);
var accelerometer_INT2 = Array(graph_num_data_point).fill(0);
var acc_idx = 0;

var bat_voltage = 0;
var bat_rsoc = 0;
//var laserStart, laserLenght, sensitivity;
//var chartLenght = 256;
//var distance = Array(3).fill(0);
//var ccd = Array(260).fill(0);
//var ccdDraw = Array(260).fill(0);
var drawCompleteFlag = true; // Flag to indicate if draw is completed (true) or not (false)
var dataFillFlag = false; // Flag to start fill new comming data into the array. 
var nLogs = 0;
var flag_logging = 0;
var log_header;


const HEADER_SIZE = 6;
const ACCEL_DATA_OFFSET_DATA_HANDLING = 10;
const ACCEL_DATA_SCALE = 5;

let csvContent = "data:text/csv;charset=utf-8,";

statusText.addEventListener('click', function() {
  statusText.textContent = 'Connecting...';
  heartRates = [];
  capacitor_1 = [];
  capacitor_2 = [];
  capacitor_3 = [];
  capacitor_4 = [];
  temperature_1 = [];
  temperature_2 = [];
  temperature_3 = [];
  temperature_4 = [];
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

startLog.addEventListener('click', function() {
if (flag_logging)
{
	startLog.innerText = 'Start logging';
	var encodedUri = encodeURI(csvContent);
   var link = document.createElement("a");
   link.setAttribute("href", encodedUri);
   link.setAttribute("download", fileName.value+".csv");
   document.body.appendChild(link); // Required for FF

   link.click();
	flag_logging = 0;
}
else
{
   csvContent = "data:text/csv;charset=utf-8,";
   csvContent += "Time Stamp;";
   if(cbCap.checked)
      csvContent += "Cap 1; Cap 2; Cap 3; Cap 4;";
   if(cbTemp.checked)
      csvContent += "Temp 1; Temp 2; Temp 3; Temp 4;";
   if(cbAcc.checked)
      csvContent += "Acc X; Acc Y; Acc Z;"
   if(cbInt.checked)
      csvContent += "INT 1; INT2;"
   if(cbFuelGauge.checked)
      csvContent += "Bat_V; BAT_%;"
   csvContent +=  "\r\n";
   startLog.innerText = 'Logging...';
	flag_logging = 1;
}

});

function handleAccelerometer(accData) {
  console.log('Accelerometer event settled');
  acc_idx = 0;
  pkg_idx = 0;
  
  accData.addEventListener('characteristicvaluechanged', event => {
    //console.log('New notification - ' + event.target.value.getUint8(0) + ' ' + event.target.value.getUint8(1) + ' ' + event.target.value.getUint8(2));
    //statusText.textContent = event.target.value.getUint8(0) + event.target.value.getUint8(1) + event.target.value.getUint8(2) + event.target.value.getUint8(3) + event.target.value.getUint8(1) + event.target.value.getUint8(4) + event.target.value.getUint8(5);
    statusText.textContent = event.target.byteLenght;
    var cap1, cap2, cap3, cap4;  // double 8 bytes
    var temp1, temp2, temp3, temp4; // float 4 bytes
    var accX, accY, accZ; // float 4 bytes
    var accINT1, accINT2; // uint8 1 byte
    var bat_v, bat_percentage; // uint16 2 bytes
    var rssi;    // int8 1 byte
    var i;
    var start_idx = 5;
    
     var data = Array(packet_size).fill(0);
     for (i = 0; i < packet_size; i++)
     {
     	 data[i] = event.target.value.getUint8(packet_size-1-i);
     }
                  
      var buf = new ArrayBuffer(packet_size);
      var view = new DataView(buf);
      data.forEach(function (b, i) {
          view.setUint8(i, b);
      });
      cap1 = view.getFloat64(start_idx+54);
      cap2 = view.getFloat64(start_idx+46);
      cap3 = view.getFloat64(start_idx+38);
      cap4 = view.getFloat64(start_idx+30);
      temp1 = view.getFloat32(start_idx+26);
      temp2 = view.getFloat32(start_idx+22);
      temp3 = view.getFloat32(start_idx+18);
      temp4 = view.getFloat32(start_idx+14);
      accX= view.getFloat32(start_idx+10);
      accY= view.getFloat32(start_idx+6);
      accZ= view.getFloat32(start_idx+2);
      bat_v = ((data[5]& 0xFF) << 8) + (data[6]& 0xFF);
      bat_percentage = ((data[3]& 0xFF) << 8) + (data[4]& 0xFF);
      accINT1 = data[2]
      accINT2 = data[1];
      
      var sign = data[0] & (1 << 7);
      rssi = (data[0] & 0x7f) * (sign !== 0 ? -1 : 1);
      
      
    if(acc_idx>=graph_num_data_point){
      acc_idx=0;
    }
      cap1 = Number(cap1).toFixed(2);
      cap2 = Number(cap2).toFixed(2);
      cap3 = Number(cap3).toFixed(2);
      cap4 = Number(cap4).toFixed(2);
      temp1 = Number(temp1).toFixed(2);
      temp2 = Number(temp2).toFixed(2);
      temp3 = Number(temp3).toFixed(2);
      temp4 = Number(temp4).toFixed(2);
      // Convert to g-scale
     accX = Number(accX/1000).toFixed(2); // divided by 2^15 and multiply by acc scale (2g) then round up to 3 digit
     accY = Number(accY/1000).toFixed(2); // divided by 2^15 and multiply by acc scale (2g) then round up to 3 digit
     accZ = Number(accZ/1000).toFixed(2); // divided by 2^15 and multiply by acc scale (2g) then round up to 3 digit
     
      
      /* Show the acc */
      accelerometerX[acc_idx] = accX*ACCEL_DATA_OFFSET_DATA_HANDLING*ACCEL_DATA_SCALE;
      accelerometerY[acc_idx] = accY*ACCEL_DATA_OFFSET_DATA_HANDLING*ACCEL_DATA_SCALE;
      accelerometerZ[acc_idx] = accZ*ACCEL_DATA_OFFSET_DATA_HANDLING*ACCEL_DATA_SCALE;
      accelerometer_INT1[acc_idx] = accINT1;
      
      bat_v = bat_v*0.001;
      bat_percentage = bat_percentage*0.1;
      //drawAcc(accX, accXCanvas);
      //drawAcc(accY, accYCanvas);
      //drawAcc(accZ, accZCanvas);
      if (acc_idx == 0)
      	drawWaves(canvas, _clear =true);
      else
      	drawWaves(canvas);
      	drawWaves_int(canvas_int);
      	
       $("#log").append('<li class="list-group-item">'+'Packet '+(pkg_idx+1).toString()+
       ':  [ '+cap1.toString()+' | '+ cap2.toString()+' | '+ cap3.toString()+' | '+ cap4.toString()+' || '+
         temp1.toString()+' | '+ temp2.toString()+' | '+ temp3.toString()+' | '+ temp4.toString()+
       ' || '+ accX.toString()+' | '+ accY.toString()+' | '+ accZ.toString()+' || '+
       accINT1.toString()+' | '+ accINT2.toString()+ ' || '+ bat_v.toString()+' | '+ bat_percentage.toString()+ ' || '+ rssi.toString()+' ]'+'</li>');
       $("#log").scrollTop(pkg_idx*100); 
       $("#log").last().focus();
    	acc_idx++;
    	pkg_idx++;
    	
    	/* Write to CSV file*/
      if (flag_logging)
      {
        var today = new Date();
        var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        var dateTime = date+' '+time;
         
         var data_array = [dateTime.toString()]
         if(cbCap.checked)
		      data_array.push(cap1.toString(), cap2.toString(), cap3.toString(), cap4.toString());
		   if(cbTemp.checked)
		      data_array.push(temp1.toString(), temp2.toString(), temp3.toString(), temp4.toString());
		   if(cbAcc.checked)
		      data_array.push(accX.toString(), accY.toString(), accZ.toString());
		   if(cbInt.checked)
		      data_array.push(accINT1.toString(), accINT2.toString());
         if(cbFuelGauge.checked)
            data_array.push(bat_v.toString(), bat_percentage.toString());
         let row = data_array.join(";");
         csvContent += row + "\r\n";
      }

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

