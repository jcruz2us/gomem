console.log('Hello World');
var es = new EventSource('/profile');
es.addEventListener('message', function(e) {
    console.log('message', e);
});

var chart = c3.generate({
    bindto: '#chart',
    history: true,
    flow: {
	duration: 100
    },
    data: {
	x : 'x',
	labels: true,
	columns: [
	    ['x', new Date().getTime()],
            ['Austin', Math.floor(Math.random() * 99)],
            ['New York', Math.floor(Math.random() * 99)],
            ['San Francisco', Math.floor(Math.random() * 99)],
            ['Portland', Math.floor(Math.random() * 99)]
	],
	types: {
	    Austin: 'area'
	}
    },
    axis: {
        x: {
            type: 'timeseries',
            tick: {
            	format: '%H:%M:%S'
              }
        }
    }
});

setInterval(function() {
    chart.flow({
        columns: [
            ['x', new Date().getTime()],
            ['Austin', Math.floor(Math.random() * 99)],
            ['New York', Math.floor(Math.random() * 99)],
            ['San Francisco', Math.floor(Math.random() * 99)],
            ['Portland', Math.floor(Math.random() * 99)]

        ],
	// Don't pop off any values
	length: 0
    });
}, 2000)
