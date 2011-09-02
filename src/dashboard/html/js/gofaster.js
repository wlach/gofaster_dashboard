/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the Mozilla GoFaster Dashboard.
 *
 * The Initial Developer of the Original Code is
 * Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Sam Liu <sam@ambushnetworks.com>
 *   William Lachance <wlachance@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

function show_graph(data) {
  $('#container').html(null);

  $.plot($("#container"), data, {
    xaxis: {
      mode: "time"
    },
    yaxis: {
      axisLabel: 'Time (Hours)'
    },
    series: {
      lines: { show: true, fill: false, steps: false },
      points: { show: true }
    },
    legend: {
      position: "nw",
      hideable: true
    }
  });
}

function update_range_selector(endpoint, type, range) {
  $("#range" + range).attr("selected", "true");
  $("#range").change(function() {
    console.log("Range is now: " + $(this).val());
    window.location.hash = '/' + [ endpoint, type, $(this).val() ].join("/");
  });
}

function divide(dividend, divisor){
    //Division function that allows division by zero (returns zero)
    quotient = dividend/divisor;
    if(isFinite(quotient)){
        return quotient;
    }
    return 0;
}

function parseDate(datestr) {
  var parsed = datestr.split("-");
  var year = parsed[0];
  var month = parsed[1] - 1; //Javascript months index from 0 instead of 1
  var day = parsed[2];

  return Date.UTC(year, month, day);
}

function to_hours(value){
    //Convert a time from seconds to hours to two decimal places
    return Math.round(value * 100 / 60 / 60) / 100;
}

//Each function below represents a graph to be displayed

function show_endtoend(mode, range) {
  $('#rightcontent').html(ich.graph({ title: mode === "os" ? "Average End to End Performance per OS" : "Average End to End Performance" }));
  update_range_selector('endtoend', mode, range);

  $.getJSON('api/endtoendtimes?mode=' + mode + "&range=" + range, function(data) {
    var end_to_end_times = data.end_to_end_times;
    var graphdata;
    if (mode === "os") {
      graphdata = Object.keys(end_to_end_times).map(function(os) {
        var series = {};
        series.label = os;
        series.data = end_to_end_times[os].map(function(datapoint) {
          return [parseDate(datapoint[0]), to_hours(datapoint[1])];
        });
        return series;
      });
    } else {
      var series = {};
      series.data = end_to_end_times.map(function(datapoint) {
        return [parseDate(datapoint[0]), to_hours(datapoint[1])];
      });

      graphdata = [ series ];
    }

    show_graph(graphdata);
  });
}

//Build and Test Execution Dashboard
function show_executiontime(type, range) {
  $('#rightcontent').html(ich.graph({ title: "Average execution times for "+type }));
  update_range_selector('executiontime', type, range);

  $.getJSON('api/executiontime?type='+type+'&range='+range, function(data) {
    var graphdata = Object.keys(data).map(function(os) {
      var series = {};
      series.label = os;
      series.data = Object.keys(data[os]).map(function(datestr) {      
        var dbg_total = divide(data[os][datestr]["debug_build"],
                               data[os][datestr]["debug_build_counter"]) + 
          divide(data[os][datestr]["debug_test"],
                 data[os][datestr]["debug_test_counter"]);
        var opt_total = divide(data[os][datestr]["opt_build"],
                               data[os][datestr]["opt_build_counter"]) + 
          divide(data[os][datestr]["opt_test"],
                 data[os][datestr]["opt_test_counter"]);
        
        return [parseDate(datestr), to_hours(Math.max(dbg_total,opt_total))];
      }).sort(function(a,b) { return a[0]-b[0]; });

      return series;
    });

    show_graph(graphdata);
  });
}

function show_waittime(type, range){
  $('#rightcontent').html(ich.graph({ title: "Average wait times for " + type }));
  update_range_selector('waittime', type, range);

  $.getJSON('api/waittime?type='+ type + "&range=" + range, function(data) {
    var graphdata = Object.keys(data).map(function(os) {
      var series = {};
      series.label = os;
      series.data = Object.keys(data[os]).map(function(datestr) {
        //Calculate datapoint display value
        var dbg_total = divide(data[os][datestr]["debug_build"],
                               data[os][datestr]["debug_build_counter"]) +
          divide(data[os][datestr]["debug_test"],
                 data[os][datestr]["debug_test_counter"]);
        var opt_total = divide(data[os][datestr]["opt_build"],
                               data[os][datestr]["opt_build_counter"]) +
          divide(data[os][datestr]["opt_test"],
                   data[os][datestr]["opt_test_counter"]);

        return [parseDate(datestr), to_hours(Math.max(dbg_total,opt_total))];
      }).sort(function(a,b) { return a[0]-b[0]; });

      return series;
    });

    show_graph(graphdata);
  });
}

function show_overhead(type, range) {
  $('#rightcontent').html(ich.graph({ title: "Average setup/teardown times for " + type }));
  update_range_selector('waittime', type, range);

  $.getJSON('api/overhead?type=' + type + "&range=" + range, function(data) {

    var graphdata = Object.keys(data).map(function(os) {
      var series = {};
      series.label = os;
      series.data = Object.keys(data[os]).map(function(datestr) {      
        //Calculate datapoint display value
        var dbg_total = divide(data[os][datestr]["debug_build"],
                               data[os][datestr]["debug_build_counter"]) + 
          divide(data[os][datestr]["debug_test"],
                 data[os][datestr]["debug_test_counter"]);
        var opt_total = divide(data[os][datestr]["opt_build"],
                               data[os][datestr]["opt_build_counter"]) + 
          divide(data[os][datestr]["opt_test"],
                   data[os][datestr]["opt_test_counter"]);

        return [parseDate(datestr), to_hours(Math.max(dbg_total,opt_total))];
      }).sort(function(a,b) { return a[0]-b[0]; });

      return series;
    });

    show_graph(graphdata);
  });
}

function show_buildcharts() {
  $('#rightcontent').html(ich.dialog({ title:"Build charts" }));

  $.getJSON("api/builds/", function(data) {
    var all_summaries = data['builds'];

    // reformat time/revision to look decent in summary form +
    // format the last job type
    all_summaries.forEach(function(buildday) {
      buildday["builds"] = buildday["builds"].map(function(b) { 
        // get description of last job (FIXME: duplication with buildchart.js)
        var jobtype = b.last_event.jobtype;
        if (b.last_event.jobtype !== "talos") {
          jobtype = b.last_event.buildtype + " " + b.last_event.jobtype;
        }

        return { 'revision': b['revision'].slice(0,8),
                 'uid': b['uid'],
                 'time_taken': ((b['time_taken'])/60.0/60.0).toFixed(3),
                 'last_event': b.last_event.os + " " + jobtype
               };
      });
    });

    $('#dialog_content').html(ich.buildcharts({ summaries: all_summaries }));
  });
}

function show_isthisbuildfaster() {

  $('#rightcontent').html(ich.dialog({ title:"Is this build faster?" }));

  $.getJSON("api/itbf/jobs/", function(data) {
    $('#dialog_content').html(ich.itbf_form({ num_itbf_jobs: data['num_pending_jobs'] }));
    $("form#itbf_form").submit(function() {
      $.ajax({
        type: 'POST',
        url: "api/itbf/jobs/",
        data: { 'tree': $('#tree').val(),
                'revision': $('#revision').val(),
                'submitter_email': $('#submitter_email').val(),
                'return_email': $('#return_email').val()
              },
        success: function(data) {
          $('#dialog_content').replaceWith(ich.itbf_submitted({ num_itbf_jobs: data['num_pending_jobs'] }));
        },
        error: function(obj, textStatus, errorThrown) {
          $('#dialog_content').replaceWith(ich.itbf_error());
        },
        dataType: 'json'
      });

      return false;
    });
  });

}

$(function() {
  var router = Router({
    '/': {
      on: function() {
        $('#rightcontent').html(ich.index());
      }
    },
    '/endtoend': {
      '/:mode': {
        '/:range': {
          on: show_endtoend
        }
      }
    },

    '/executiontime': {
      '/:type': {
        '/:range': {
          on: show_executiontime
        }
      }
    },
    '/waittime': {
      '/:type': {
        '/:range': {
          on: show_waittime
        }
      }
    },
    '/overhead': {
      '/:type': {
        '/:range': {
          on: show_overhead
        }
      }
    },
    '/buildcharts': {
      on: show_buildcharts
    },
    '/isthisbuildfaster': {
      on: show_isthisbuildfaster
    }
  }).init('/');
});
