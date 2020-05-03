var month_names = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

var convertMonths = function(months) {
  return months.map(month => month_names[month-1]);
};

var normalizeHemisphere = function(hemisphere) {
  return hemisphere === 'northern' ? 'N' : 'S';
};

var generateDate = function(time_value) {
  var today = new Date();
  var year = today.getFullYear();
  var month = today.getMonth();
  var day = today.getDate();
  var parts = time_value.split(':');
  var hour = parts[0];
  var minute = parts[1];
  return new Date(year, month, day, hour, minute, 0);
};

var app = new Vue({
  el: '#app',
  vuetify: new Vuetify({
    theme: {
      themes: {
        light: {
          primary: '#0ab5cd',
          secondary: '#fffae5',
          header: '#686868',
          toolbar: '#f5f8fe',
          font: '#837865',
          error: '#e76e60',
        },
      },
    },
  }),

  created() {
    this.getFishData();
    this.getBugData();
    interval = setInterval(() => this.now = new Date(), 1000);
  },

  data: {
    now: new Date(),
    month_names: month_names,
    tab: null,
    toggle_fish_lookup_time: false,
    fish_lookup_time_input: null,
    fish_lookup_time: null,
    toggle_fish_hemisphere: ['N','S'],

    toggle_bug_lookup_time: false,
    bug_lookup_time_input: null,
    bug_lookup_time: null,
    toggle_bug_hemisphere: ['N','S'],

    fish_high_price_threshold: 1000,
    bug_high_price_threshold: 1000,
    fish_month_filter: null,
    bug_month_filter: null,

    fish_group_by_keys: ['location', 'shadow_size'],
    fish_group_by: null,

    bug_group_by_keys: ['location'],
    bug_group_by: null,

    fish_data: [],
    northern_fish_data: [],
    southern_fish_data: [],
    current_hour_fish_data: [],
    outgoing_fish_data: [],
    incoming_fish_data: [],
    this_month_fish_data: [],
    complete_fish_data: [],
    fish_headers: [
      {
        text: 'Name',
        align: 'start',
        sortable: true,
        value: 'name',
      },
      { text: 'Price', value: 'price' },
      { text: 'Location', value: 'location' },
      { text: 'Shadow Size', value: 'shadow_size' },
      { text: 'Time Range', value: 'time' },
      { text: 'Months', value: 'month_names' },
      { text: 'Hemisphere', value: 'hemisphere' },
    ],

    bug_data: [],
    northern_bug_data: [],
    southern_bug_data: [],
    current_hour_bug_data: [],
    outgoing_bug_data: [],
    incoming_bug_data: [],
    this_month_bug_data: [],
    complete_bug_data: [],
    bug_headers: [
      {
        text: 'Name',
        align: 'start',
        sortable: true,
        value: 'name',
      },
      { text: 'Price', value: 'price' },
      { text: 'Location', value: 'location' },
      { text: 'Time Range', value: 'time' },
      { text: 'Months', value: 'month_names' },
      { text: 'Hemisphere', value: 'hemisphere' },
    ],

  },

  methods: {
    getFishData: function() {
      var vm = this;
      $.ajax({
        url: 'https://raw.githubusercontent.com/rebekahgkh/ac_nh_critters/master/data/combined_fish.json',
        method: 'GET'
      }).then(function (data) {
        var fish_data = JSON.parse(data).data;
        var formatted_data = fish_data.map(function(row) {
          var updated_row = row;
          updated_row.month_names = convertMonths(row.months);
          updated_row.hemisphere = normalizeHemisphere(row.hemisphere);
          return updated_row;
        });

        vm.fish_data = formatted_data;
      });
    },

    getBugData: function() {
      var vm = this;
      $.ajax({
        url: 'https://raw.githubusercontent.com/rebekahgkh/ac_nh_critters/master/data/combined_bug.json',
        method: 'GET'
      }).then(function (data) {
        var bug_data = JSON.parse(data).data;
        var formatted_data = bug_data.map(function(row) {
          var updated_row = row;
          updated_row.month_names = convertMonths(row.months);
          updated_row.hemisphere = normalizeHemisphere(row.hemisphere);
          return updated_row;
        });

        vm.bug_data = formatted_data;
      });
    },

    filterCurrentHour: function(data, lookup_time, selected_hemispheres) {
      var vm = this;
      var filter_time = lookup_time ? lookup_time : vm.now;
      var current_month = filter_time.getMonth() + 1;
      var current_hour = filter_time.getHours();
      return data.filter(function(row) {
        return row.months.includes(current_month) && row.hours.includes(current_hour) && selected_hemispheres.includes(row.hemisphere);
      });
    },

    filterOutgoing: function(data, selected_hemispheres) {
      var vm = this;
      var this_month = vm.now.getMonth() + 1;
      var next_month = this_month + 1;
      return data.filter(row => row.months.includes(this_month) && !row.months.includes(next_month) && selected_hemispheres.includes(row.hemisphere));
    },

    filterIncoming: function(data, selected_hemispheres) {
      var vm = this;
      var this_month = vm.now.getMonth() + 1;
      var next_month = this_month + 1;
      return data.filter(row => !row.months.includes(this_month) && row.months.includes(next_month) && selected_hemispheres.includes(row.hemisphere));
    },

    filterThisMonth: function(data, selected_hemispheres) {
      var vm = this;
      var this_month = vm.now.getMonth() + 1;
      return data.filter(row => row.months.includes(this_month) && selected_hemispheres.includes(row.hemisphere));
    },

    filterComplete: function(data, selected_hemispheres, month_filter) {
      var vm = this;
      return data.filter(row => selected_hemispheres.includes(row.hemisphere) && (!month_filter || row.month_names.includes(month_filter)));
    },

    filterFishData: function() {
      var vm = this;
      vm.current_hour_fish_data = vm.filterCurrentHour(vm.fish_data, vm.fish_lookup_time, vm.toggle_fish_hemisphere);
      vm.outgoing_fish_data = vm.filterOutgoing(vm.fish_data, vm.toggle_fish_hemisphere);
      vm.incoming_fish_data = vm.filterIncoming(vm.fish_data, vm.toggle_fish_hemisphere);
      vm.this_month_fish_data = vm.filterThisMonth(vm.fish_data, vm.toggle_fish_hemisphere);
      vm.complete_fish_data = vm.filterComplete(vm.fish_data, vm.toggle_fish_hemisphere, vm.fish_month_filter);
    },

    filterBugData: function() {
      var vm = this;
      vm.current_hour_bug_data = vm.filterCurrentHour(vm.bug_data, vm.bug_lookup_time, vm.toggle_bug_hemisphere);
      vm.outgoing_bug_data = vm.filterOutgoing(vm.bug_data, vm.toggle_bug_hemisphere);
      vm.incoming_bug_data = vm.filterIncoming(vm.bug_data, vm.toggle_bug_hemisphere);
      vm.this_month_bug_data = vm.filterThisMonth(vm.bug_data, vm.toggle_bug_hemisphere);
      vm.complete_bug_data = vm.filterComplete(vm.bug_data, vm.toggle_bug_hemisphere, vm.bug_month_filter);
    },

    highlightPrice: function(price, price_threshold) {
      if (price >= price_threshold) {
        return '#e76e60';
      } else {
        return 'white';
      }
    },

  },

  watch: {
    fish_data: function(new_val, old_val) {
      var vm = this;
      if (new_val.length > 0) {
        vm.filterFishData();
      }
    },

    bug_data: function(new_val, old_val) {
      var vm = this;
      if (new_val.length > 0) {
        vm.filterBugData();
      }
    },

    fish_lookup_time_input: function(new_val, old_val) {
      var vm = this;
      vm.fish_lookup_time = generateDate(new_val);
      vm.filterFishData();
    },

    bug_lookup_time_input: function(new_val, old_val) {
      var vm = this;
      vm.bug_lookup_time = generateDate(new_val);
      vm.filterBugData();
    },

    toggle_fish_hemisphere: function(new_val, old_val) {
      var vm = this;
      vm.filterFishData();
    },

    toggle_bug_hemisphere: function(new_val, old_val) {
      var vm = this;
      vm.filterBugData();
    },

    fish_month_filter: function(new_val, old_val) {
      var vm = this;
      vm.filterFishData();
    },

    bug_month_filter: function(new_val, old_val) {
      var vm = this;
      vm.filterBugData();
    },

  },

  filters: {
    time_normalized: function(value) {
      if (!value) {
        return '';
      }

      var h = value.getHours();
      var m = value.getMinutes();
      var s = value.getSeconds();
      var parts = [h, m, s];

      var normalized_parts = parts.map(function(part) {
        var i = parseInt(part);
        if (i < 10) {
          return `0${i}`;
        } else {
          return `${i}`;
        }
      });

      return normalized_parts.join(':');
    },

    month_name: function(value) {
      if (!value) {
        return '';
      }

      var month = value.getMonth();
      return month_names[month];
    },
  },
});
