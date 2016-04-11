var es = new EventSource('/profile');

var state = {
    memstats: {}
};

var bytesToString = function(bytes) {
    var fmt = d3.format('.2f');
    if (bytes < 1024) {
        return fmt(bytes) + 'B';
    } else if (bytes < 1024 * 1024) {
        return fmt(bytes / 1024) + 'kB';
    } else if (bytes < 1024 * 1024 * 1024) {
        return fmt(bytes / 1024 / 1024) + 'MB';
    } else {
        return fmt(bytes / 1024 / 1024 / 1024) + 'GB';
    }
};

m.mount(document.getElementById("stats"), {
    controller: function() {
        var viewModel = {
            stats: function() {
                var items = [
                    'Alloc',
                    'HeapAlloc',
                    'HeapIdle',
                    'HeapInuse',
                    'HeapSys',
                    'StackInuse',
                    'StackSys',
                    'Sys',
                    'TotalAlloc'
                ];
                var retVal = {};
                items.forEach(function(item) {
                    retVal[item] = bytesToString(state.memstats[item]);
                });
                return retVal;
            }
        };
        return viewModel;
    },
    view: function(ctrl) {
        var stats = ctrl.stats();
        return m('div', Object.keys(stats).map(function(key) {
            return m('div', {
                key: key
            }, [
                m('strong', `${key}:`),
                m('span', stats[key])
            ]);
        }));
    }
});


var chart = c3.generate({
    bindto: '#chart',
    data: {
        x: 'x',
        columns: [
            ['x', new Date().getTime()],
            ['HeapAlloc', 0],
            ['HeapSys', 0],
            ['Sys', 0]
        ],
        types: {
            HeapAlloc: 'area',
            HeapSys: 'area'
        }
    },
    axis: {
        x: {
            type: 'timeseries',
            tick: {
                format: '%H:%M:%S'
            }
        },
        y: {
            tick: {
                format: bytesToString
            }
        }
    }
});

var heapChart = c3.generate({
    bindto: '#heap-breakdown',
    data: {
        type: 'pie',
        columns: [
            ['HeapIdle', 0],
            ['HeapInuse', 0]
        ]
    }
});

es.addEventListener('message', function(e) {
    var mem = JSON.parse(e.data);
    chart.flow({
        columns: [
            ['x', new Date().getTime()],
            ['HeapAlloc', mem.HeapAlloc],
            ['HeapSys', mem.HeapSys],
            ['Sys', mem.Sys]
        ],
        // Don't pop off any values
        length: 0
    });
    heapChart.flow({
        columns: [
            ['HeapIdle', mem.HeapIdle],
            ['HeapInuse', mem.HeapInuse]
        ]
    });
    m.startComputation();
    state.memstats = mem;
    m.endComputation();
    //console.log('message', JSON.parse(e.data));
});
