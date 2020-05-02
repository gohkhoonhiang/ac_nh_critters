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

var convert_months = function(months) {
  return months.map(function(month) {
    return month_names[month-1];
  });
};

var normalize_hemisphere = function(hemisphere) {
  return hemisphere === 'northern' ? 'N' : 'S';
};

var app = new Vue({
  el: '#app',
  vuetify: new Vuetify(),
  created() {
    this.getFishData();
    this.getBugData();
    interval = setInterval(() => this.now = new Date(), 1000);
  },

  data: {
    message: 'This is the Animal Crossing: New Horizons complete critters list.',
    now: new Date(),
    tab: null,
    toggle_lookup_time: false,
    lookup_time_input: null,
    lookup_time: null,
    toggle_hemisphere: ['N','S'],
    toggle_group_by: false,
    group_by_keys: [{ label: 'Location', val: 'location' }, { label: 'Shadow Size', val: 'shadow_size' }],
    group_by: {},

    fish_data: [],
    northern_fish_data: [],
    southern_fish_data: [],
    filtered_fish_data: [],
    outgoing_fish_data: [],
    incoming_fish_data: [],
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
    filtered_bug_data: [],
    outgoing_bug_data: [],
    incoming_bug_data: [],
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
          updated_row.month_names = convert_months(row.months);
          updated_row.hemisphere = normalize_hemisphere(row.hemisphere);
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
          updated_row.month_names = convert_months(row.months);
          updated_row.hemisphere = normalize_hemisphere(row.hemisphere);
          return updated_row;
        });

        vm.bug_data = formatted_data;
      });
    },

    filterData: function(data) {
      var vm = this;
      var filter_time = vm.lookup_time ? vm.lookup_time : vm.now;
      var current_hour = filter_time.getHours();
      var selected_hemispheres = vm.toggle_hemisphere;
      return data.filter(function(row) {
        return row.hours.includes(current_hour) && selected_hemispheres.includes(row.hemisphere);
      });
    },

    filterOutgoing: function(data) {
      var vm = this;
      var this_month = vm.now.getMonth() + 1;
      var next_month = this_month + 1;
      return data.filter(row => row.months.includes(this_month) && !row.months.includes(next_month));
    },

    filterIncoming: function(data) {
      var vm = this;
      var this_month = vm.now.getMonth() + 1;
      var next_month = this_month + 1;
      return data.filter(row => !row.months.includes(this_month) && row.months.includes(next_month));
    },

    filterFishData: function() {
      var vm = this;
      vm.filtered_fish_data = vm.filterData(vm.fish_data);
      vm.outgoing_fish_data = vm.filterOutgoing(vm.filtered_fish_data);
      vm.incoming_fish_data = vm.filterIncoming(vm.filtered_fish_data);
    },

    filterBugData: function() {
      var vm = this;
      vm.filtered_bug_data = vm.filterData(vm.bug_data);
      vm.outgoing_bug_data = vm.filterOutgoing(vm.filtered_bug_data);
      vm.incoming_bug_data = vm.filterIncoming(vm.filtered_bug_data);
    },

  },

  watch: {
    fish_data: function(newVal, oldVal) {
      var vm = this;
      if (newVal.length > 0) {
        vm.filterFishData();
      }
    },

    bug_data: function(newVal, oldVal) {
      var vm = this;
      if (newVal.length > 0) {
        vm.filterBugData();
      }
    },

    lookup_time_input: function(newVal, oldVal) {
      var vm = this;
      var today = new Date();
      var year = today.getFullYear();
      var month = today.getMonth();
      var day = today.getDate();
      var parts = newVal.split(':');
      var hour = parts[0];
      var minute = parts[1];
      vm.lookup_time = new Date(year, month, day, hour, minute, 0);
      vm.filterFishData();
      vm.filterBugData();
    },

    toggle_hemisphere: function(newVal, oldVal) {
      var vm = this;
      vm.filterFishData();
      vm.filterBugData();
    },

    toggle_group_by: function(newVal, oldVal) {
      var vm = this;
      if(!newVal) {
        vm.group_by = {};
      }
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
