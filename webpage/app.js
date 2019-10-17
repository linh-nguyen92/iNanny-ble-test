var canvas = document.querySelector('#waves');
var ccdCanvas = document.querySelector('#ccdDisplay');
var accXCanvas = document.querySelector('#accXDisplay');
var accYCanvas = document.querySelector('#accYDisplay');
var accZCanvas = document.querySelector('#accZDisplay');
var statusText = document.querySelector('#statusText');

var lbIntTime = document.getElementById("intTime");
var lbLaserDist = document.getElementById("laserDistance");
var lbLaserStart = document.getElementById("laserDetectPx");
var lbLaserLength = document.getElementById("laserWaveLength");

var lbIntTime2 = document.getElementById("intTime2");
var lbLaserDist2 = document.getElementById("laserDistance2");
var lbLaserStart2 = document.getElementById("laserDetectPx2");
var lbLaserLength2 = document.getElementById("laserWaveLength2");

var lbIntTime3 = document.getElementById("intTime3");
var lbLaserDist3 = document.getElementById("laserDistance3");
var lbLaserStart3 = document.getElementById("laserDetectPx3");
var lbLaserLength3 = document.getElementById("laserWaveLength3");

var ccdMode = document.getElementById("ccdModeSelector");
var logEn = document.getElementById("logEnabled");
var lbAccX = document.getElementById("accX");
var lbAccY = document.getElementById("accY");
var lbAccZ = document.getElementById("accZ");

var heartRates = [];
var accelerometerX = [];
var accelerometerY = [];
var accelerometerZ = [];
var laserStart, laserLenght, sensitivity;
var chartLenght = 256;
var distance = Array(3).fill(0);
var ccd = Array(260).fill(0);
var ccdDraw = Array(260).fill(0);
var drawCompleteFlag = true; // Flag to indicate if draw is completed (true) or not (false)
var dataFillFlag = false; // Flag to start fill new comming data into the array. 
var nLogs = 0;
const HEADER_SIZE = 6;
const CCD_IDENTIFIER = new Uint8Array([0xac, 0xad, 0xae]);

statusText.addEventListener('click', function() {
  statusText.textContent = 'Connecting...';
  heartRates = [];
  accelerometerX = [];
  accelerometerY = [];
  accelerometerZ = [];
  tkba.connect()
  .then(() => tkba.writeKeyPermission())
  .then(() => {statusText.textContent = 'Connected, waitting for data...';})
  .then(() => tkba.startNotificationsAccelerometer().then(handleAccelerometer))
  .then(() => tkba.startNotificationsCCD().then(handleCCD))
  .catch(error => {
    statusText.textContent = error;
  });
});

function handleAccelerometer(accData) {
  console.log('Accelerometer event settled');
  var postscale = 0;
  
  accData.addEventListener('characteristicvaluechanged', event => {
    //console.log('New notification - ' + event.target.value.getUint8(0) + ' ' + event.target.value.getUint8(1) + ' ' + event.target.value.getUint8(2));
    //statusText.textContent = event.target.value.getUint8(0) + event.target.value.getUint8(1) + event.target.value.getUint8(2) + event.target.value.getUint8(3) + event.target.value.getUint8(1) + event.target.value.getUint8(4) + event.target.value.getUint8(5);
    var accX, accY, accZ;
    
    var sign = event.target.value.getUint8(1) & (1 << 7);
    var accX = (((event.target.value.getUint8(1) & 0xFF) << 8) | (event.target.value.getUint8(0) & 0xFF));
    if (sign) {
       accX = 0xFFFF0000 | accX;  // fill in most significant bits with 1's
    }
    var sign = event.target.value.getUint8(3) & (1 << 7);
    var accY = (((event.target.value.getUint8(3) & 0xFF) << 8) | (event.target.value.getUint8(2) & 0xFF));
    if (sign) {
       accY = 0xFFFF0000 | accY;  // fill in most significant bits with 1's
    }
    var sign = event.target.value.getUint8(5) & (1 << 7);
    var accZ = (((event.target.value.getUint8(5) & 0xFF) << 8) | (event.target.value.getUint8(4) & 0xFF));
    if (sign) {
       accZ = 0xFFFF0000 | accZ;  // fill in most significant bits with 1's
    }

    postscale++;
    if(postscale>=20){
      postscale=0;
      // Convert to g-scale
     accX = Number((2*accX/32767).toFixed(3)); // divided by 2^15 and multiply by acc scale (2g) then round up to 3 digit
     accY = Number((2*accY/32767).toFixed(3)); // divided by 2^15 and multiply by acc scale (2g) then round up to 3 digit
     accZ = Number((2*accZ/32767).toFixed(3)); // divided by 2^15 and multiply by acc scale (2g) then round up to 3 digit
      
      /* Show the acc */
      lbAccX.innerHTML = accX.toString();
      lbAccY.innerHTML = accY.toString();
      lbAccZ.innerHTML = accZ.toString();
      
      drawAcc(accX, accXCanvas);
      drawAcc(accY, accYCanvas);
      drawAcc(accZ, accZCanvas);
//      heartRates.push(accY);
//     accelerometerX.push(accX);
//      accelerometerY.push(accY);
//      accelerometerZ.push(accZ);
//      drawWaves();
    }
  });
}

function handleCCD(ccdData) {
  console.log('CCD event settled');
  var postscale = 0;
  var offset = 6; // Variable for data location offset in the received packet
  var plotColor = '#900c3f';
  
  ccdData.addEventListener('characteristicvaluechanged', event => {
    statusText.textContent = event.target.byteLenght;
    //console.log(event.target.value);
    
    if(ccdMode.innerHTML === "3"){
  
      var data = [event.target.value.getUint8(13),
                  event.target.value.getUint8(12),
                  event.target.value.getUint8(11),
                  event.target.value.getUint8(10),
      				event.target.value.getUint8(9),
                  event.target.value.getUint8(8),
                  event.target.value.getUint8(7),
                  event.target.value.getUint8(6),
      				event.target.value.getUint8(5),
                  event.target.value.getUint8(4),
                  event.target.value.getUint8(3),
                  event.target.value.getUint8(2)];
      var buf = new ArrayBuffer(12);
      var view = new DataView(buf);
      data.forEach(function (b, i) {
          view.setUint8(i, b);
      });
      distance[0] = view.getFloat32(8);
      lbLaserDist.innerHTML = Number((distance[0]).toFixed(2)).toString() + "mm";
      sensitivity = event.target.value.getUint8(0)<<8 | event.target.value.getUint8(1);
      lbIntTime.innerHTML = sensitivity.toString() + " CPU clocks";
      
      distance[1] = view.getFloat32(4);
      lbLaserDist2.innerHTML = Number((distance[1]).toFixed(2)).toString() + "mm";
      lbIntTime2.innerHTML = lbIntTime.innerHTML;
      
      distance[2] = view.getFloat32(0);
      lbLaserDist3.innerHTML = Number((distance[2]).toFixed(2)).toString() + "mm";
      lbIntTime3.innerHTML = lbIntTime.innerHTML;
      
      if(logEn.innerHTML === "1"){
        $("#log").append('<li class="list-group-item">'+distance.toString()+'</li>');
        $("#log").scrollTop(nLogs*100); 
        $("#log").last().focus();
        nLogs++;
      }
		ccdDraw = ccd;
		ccd.fill(0);
		for (var idx = 0; idx<3; idx++)
	   	if (distance[idx] >0){
	   		ccd[Math.round(distance[idx]/0.0635)] = 2800;
   	}	   	
	   		   	
   	drawCCD()  	
   	drawWavesMode3(canvas,distance);	   	       
      /*
      console.log(event.target.value.getUint8(0).toString() + " " +
                  event.target.value.getUint8(1).toString() + " " +
                  event.target.value.getUint8(2).toString() + " " +
                  event.target.value.getUint8(3).toString() + " " +
                  event.target.value.getUint8(4).toString() + " " +
                  event.target.value.getUint8(5).toString() );
      */
    }
    else {
      if((event.target.value.getUint8(0) == CCD_IDENTIFIER[0] && event.target.value.getUint8(5) == CCD_IDENTIFIER[0]) || 
      (event.target.value.getUint8(0) == CCD_IDENTIFIER[1] && event.target.value.getUint8(5) == CCD_IDENTIFIER[1]) || 
      (event.target.value.getUint8(0) == CCD_IDENTIFIER[2] && event.target.value.getUint8(5) == CCD_IDENTIFIER[2]) || 
      postscale > 25){
      	ccd.fill(0);
			postscale=0;
			offset = HEADER_SIZE;

			laserStart = event.target.value.getUint8(3);
			laserLenght = event.target.value.getUint8(4);
			distance = ((event.target.value.getUint8(3)+(event.target.value.getUint8(4).toString()/2)));
        
			// Get what CCD is sending data
			if(event.target.value.getUint8(0) == CCD_IDENTIFIER[0] && event.target.value.getUint8(5) == CCD_IDENTIFIER[0])
			{
				// Clear the graph
    			
				plotColor = '#900c3f';
				lbLaserStart.innerHTML = "pixel number " + laserStart.toString();
				lbLaserLength.innerHTML = laserLenght.toString() + " pixels";
				lbIntTime.innerHTML = (event.target.value.getUint8(1)<<8 | event.target.value.getUint8(2)).toString() + " CPU clocks";
				lbLaserDist.innerHTML = distance.toString() + " pixels";
			}
			else
			{
				if(event.target.value.getUint8(0) == CCD_IDENTIFIER[1] && event.target.value.getUint8(5) == CCD_IDENTIFIER[1])
				{
					lbLaserStart2.innerHTML = "pixel number " + laserStart.toString();
					lbLaserLength2.innerHTML = laserLenght.toString() + " pixels";
					lbIntTime2.innerHTML = (event.target.value.getUint8(1)<<8 | event.target.value.getUint8(2)).toString() + " CPU clocks";
					lbLaserDist2.innerHTML = distance.toString() + " pixels";
					plotColor = '#0000ff';
				}

				else 
				{
					if(event.target.value.getUint8(0) == CCD_IDENTIFIER[2] && event.target.value.getUint8(5) == CCD_IDENTIFIER[2])
					{
						lbLaserStart3.innerHTML = "pixel number " + laserStart.toString();
				     lbLaserLength3.innerHTML = laserLenght.toString() + " pixels";
				     lbIntTime3.innerHTML = (event.target.value.getUint8(1)<<8 | event.target.value.getUint8(2)).toString() + " CPU clocks";
				     lbLaserDist3.innerHTML = distance.toString() + " pixels";
				   	plotColor = '#00ff00';
					}
				}
			}

			if(ccdMode.innerHTML === "2")
			{
			   //chartLenght = laserLenght;
			    //ccd.fill(0);  
			   dataFillFlag = false;
				if (drawCompleteFlag){
					ccdDraw = ccd;
					for(var i=0 ; i<laserStart; i++) ccd[i]=0;
					for(var i=laserStart+laserLenght+1; i<255; i++) ccd[i]=0;
					drawCompleteFlag = false;
					dataFillFlag = true;
				}

			}               
       }
       
      if(ccdMode.innerHTML === "2" ){
			for(var i=offset ; i<20; i+=2)
	        	ccd[postscale*10+(i-HEADER_SIZE)/2+laserStart]=(((event.target.value.getUint8(i) & 0xFF) << 8) | (event.target.value.getUint8(i+1) & 0xFF));

			offset = 0;
			postscale++;
			drawWaves(canvas, plotColor);
			drawCCD();
		}
		
		if(ccdMode.innerHTML === "1"){
			for(var i=offset ; i<20 ; i+=2)
		        ccd[postscale*10+(i-HEADER_SIZE)/2]=(((event.target.value.getUint8(i) & 0xFF) << 8) | (event.target.value.getUint8(i+1) & 0xFF));
			
			//plotRange[0] = postscale*10+(offset-HEADER_SIZE)/2;
			//plotRange[1] = postscale*10+(18-HEADER_SIZE)/2;
								
			ccd[postscale*10+7]=0xaaaaaaaa; //Add a peak just to visualize the "scanning"
			drawCCD();
			drawWaves(canvas, plotColor);
				

			postscale++;
			offset = 0; 
		 }	      
   	
		//drawCCD();
		//drawWaves();
    }
  });
}

function drawCCD() {
  requestAnimationFrame(() => {
    ccdCanvas.width = parseInt(getComputedStyle(canvas).width);
    ccdCanvas.height = 50;
    
    var context = ccdCanvas.getContext('2d');
    context.clearRect(0, 0, ccdCanvas.width, ccdCanvas.height);

    var square_side = canvas.width/chartLenght;
    for(var i = 3; i<258 ; i++)
    {
	     	if(ccdMode.innerHTML === "2" || ccdMode.innerHTML === "3"){
	     		var pixel = ((ccdDraw[i]>>4).toString(16));
	     	}
	     	else{
      		var pixel = ((ccd[i]>>4).toString(16));
			}
      var RR = ((pixel.length==1)?("0"+pixel):(pixel));
      context.fillStyle = '#'+RR+'0000';
      context.fillRect((i-3)*square_side, 0, square_side, 50);
      context.stroke();
    }
  });
}

function drawWavesMode3(_canvas, distance) {
  requestAnimationFrame(() => {
    _canvas.width = parseInt(getComputedStyle(canvas).width.slice(0, -2)) * devicePixelRatio;
    _canvas.height = 200;//parseInt(getComputedStyle(_canvas).height.slice(0, -2)) * devicePixelRatio;

    var context = _canvas.getContext('2d');
    var margin = 2;
    var max = Math.max(0, Math.round(_canvas.width / 11));
    //var offset = Math.max(0, heartRates.length - max);
    context.clearRect(0, 0, _canvas.width, _canvas.height);
    
    context.beginPath();
    context.lineWidth = 6;
    context.lineJoin = 'round';
    context.shadowBlur = '1';
    context.strokeStyle = '#900c3f';
    context.shadowOffsetY = '1';
    
    var square_side = _canvas.width/chartLenght;
	// CCD 1
   context.moveTo(0, _canvas.height-10);
 	context.lineTo(square_side * (Math.round(distance[0]/0.0635)-1), _canvas.height-10);
 	if (distance[0]>0)
 		context.lineTo(square_side * (Math.round(distance[0]/0.0635)), 10);
 	context.lineTo(square_side * (Math.round(distance[0]/0.0635)+1), _canvas.height-10);
 	context.lineTo(square_side * (254), _canvas.height-10);
 	context.stroke();
 		// CCD 2
 	context.beginPath();
    context.lineWidth = 6;
    context.lineJoin = 'round';
    context.shadowBlur = '2';
 	context.strokeStyle = '#0000ff';
 	context.shadowOffsetY = '1';
 	
   context.moveTo(0, _canvas.height-10);
 	context.lineTo(square_side * (Math.round(distance[1]/0.0635)-1), _canvas.height-10);
 	if (distance[1]>0)
 		context.lineTo(square_side * (Math.round(distance[1]/0.0635)), 10);
 	context.lineTo(square_side * (Math.round(distance[1]/0.0635)+1), _canvas.height-10);
 	context.lineTo(square_side * (254), _canvas.height-10);
 	context.stroke();
 		// CCD 3
 		context.beginPath();
    context.lineWidth = 6;
    context.lineJoin = 'round';
    context.shadowBlur = '3';
 	context.strokeStyle = '#00ff00';
 	context.shadowOffsetY = '1';
 	
   context.moveTo(0, _canvas.height-10);
 	context.lineTo(square_side * (Math.round(distance[2]/0.0635)-1), _canvas.height-10);
 	if (distance[2]>0)
 		context.lineTo(square_side * (Math.round(distance[2]/0.0635)), 10);
 	context.lineTo(square_side * (Math.round(distance[2]/0.0635)+1), _canvas.height-10);
 	context.lineTo(square_side * (254), _canvas.height-10);
	      
    context.stroke();
  });
  drawCompleteFlag = true;
}
function drawWaves(_canvas, _color = '#900c3f') {
  requestAnimationFrame(() => {
		_canvas.width = parseInt(getComputedStyle(_canvas).width.slice(0, -2)) * devicePixelRatio;
		_canvas.height = 200;//parseInt(getComputedStyle(_canvas).height.slice(0, -2)) * devicePixelRatio;

		var context = _canvas.getContext('2d');
		var margin = 2;
		var max = Math.max(0, Math.round(_canvas.width / 11));
		//var offset = Math.max(0, heartRates.length - max);
		context.clearRect(0, 0, _canvas.width, _canvas.height);
		context.beginPath();
		context.lineWidth = 6;
		context.lineJoin = 'round';
		context.shadowBlur = '1';
		context.strokeStyle = _color;
		context.shadowOffsetY = '1';
    
    	var square_side = _canvas.width/chartLenght;
  
		//if( ccdMode.innerHTML === "2")
		{
			context.moveTo(0, _canvas.height-((ccd[i]>>4)&0xff)-10);
			for(var i = 1; i<255 ; i++)
	    	{
		      context.lineTo(square_side * (i), _canvas.height-((ccd[i]>>4)&0xff)-10);
		    }
	    }
	    /*
		if( ccdMode.innerHTML === "1")
		{
			if (clear)
				context.clearRect(0, 0, _canvas.width, _canvas.height);
			if (plotRange[0] != 0)
				context.moveTo(square_side * (plotRange[0]), _canvas.height-((ccd[plotRange[0]-1]>>4)&0xff)-10);
			else
				context.moveTo(0, _canvas.height-((ccd[0]>>4)&0xff)-10);
			for(var i = plotRange[0]+1; i<= plotRange[1]; i++)
	    	{
			     	context.lineTo(square_side * (i), _canvas.height-((ccd[i]>>4)&0xff)-10);
		  	}
		}
		*/
    context.stroke();
  });
 // drawCompleteFlag = true;
}
function clearWaves(_canvas)
{
		var context = _canvas.getContext('2d');
    	context.clearRect(0, 0, _canvas.width, _canvas.height);
    	_canvas.stroke();
}
function drawAcc(_acc, _canvas){
	 requestAnimationFrame(() => {
    _canvas.width = parseInt(getComputedStyle(canvas).width);
    _canvas.height = 20;
    
    var context = _canvas.getContext('2d');
    context.clearRect(0, 0, _canvas.width, ccdCanvas.height);

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
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    drawCCD();
    drawWaves();
  }
});

