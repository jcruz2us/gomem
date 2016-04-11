var es = new EventSource('/profile');

var state = {
    memstats: {},
    stream: []
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

var TotalSystemBreakdown = {
    view: function() {
        var total = bytesToString(state.stream[0] && state.stream[0].Sys);
        var tsb = m('.total-system-breakdown', {
            config: function(element, isInit, ctx) {
                var mem = state.stream[0];
                if (!isInit) {
                    ctx.chart = c3.generate({
                        bindto: element,
                        data: {
                            type: 'pie',
                            columns: [
                                ['HeapSys', 0],
                                ['StackSys', 0],
                                ['MSpanSys', 0],
                                ['MCacheSys', 0],
                                ['BuckHashSys', 0],
                                ['GCSys', 0],
                                ['OtherSys', 0]
                            ]
                        }
                    });
                } else {
                    ctx.chart.flow({
                        columns: [
                            ['HeapSys', mem.HeapSys],
                            ['StackSys', mem.StackSys],
                            ['MSpanSys', mem.MSpanSys],
                            ['MCacheSys', mem.MCacheSys],
                            ['BuckHashSys', mem.BuckHashSys],
                            ['GCSys', mem.GCSys],
                            ['OtherSys', mem.OtherSys]
                        ]
                    });
                }
            }
        });
        return m('div', [
            m('div', total),
            tsb
        ]);
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
                    'TotalAlloc',
                    'HeapReleased'
                    //'HeapObjec'
                ];
                var retVal = {};
                items.forEach(function(item) {
                    retVal[item] = bytesToString(state.memstats[item]);
                });

                var otherItems = [
                    'HeapObjects',
                    'NumGC',
                    'PauseTotalNs'
                ];
                otherItems.forEach(function(item) {
                    retVal[item] = state.memstats[item];
                });

                return retVal;
            }
        };
        return viewModel;
    },
    view: function(ctrl) {
        var stats = ctrl.stats();
        var info = m('div', Object.keys(stats).map(function(key) {
            return m('div', {
                key: key
            }, [
                m('strong', `${key}:`),
                m('span', stats[key])
            ]);
        }));

        return m('div', [
            m(TotalSystemBreakdown),
            info
        ]);
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
    mem.timestamp = new Date().getTime();
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
    state.stream.unshift(mem);
    m.endComputation();
    //console.log('message', JSON.parse(e.data));
});
