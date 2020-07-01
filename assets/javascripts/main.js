var latest_data_version = '2bcad07';

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

var hasElement = function(array, value) {
  return array.filter(ele => ele === value).length > 0;
};

var addElement = function(array, value) {
  return array.concat(value);
};

var removeElement = function(array, value) {
  var foundIndex = array.indexOf(value);
  if (foundIndex >= 0) {
    array.splice(foundIndex, 1);
  }
  return array;
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
    this.retrieveSettings();
    if (this.data_version !== latest_data_version) {
      this.getFishData();
      this.getBugData();
      this.data_version = latest_data_version;
    }
    interval = setInterval(() => this.now = new Date(), 1000);
  },

  data: {
    now: new Date(),
    month_names: month_names,
    tab: null,

    data_version: null,

    fish_lookup_time_input: null,
    fish_lookup_time: null,
    toggle_fish_hemisphere: ['N','S'],
    toggle_fish_new_this_month: false,

    bug_lookup_time_input: null,
    bug_lookup_time: null,
    toggle_bug_hemisphere: ['N','S'],
    toggle_bug_new_this_month: false,

    fish_high_price_threshold: 1000,
    bug_high_price_threshold: 1000,
    fish_month_filter: [],
    bug_month_filter: [],

    donated_fishes: [],
    donated_bugs: [],

    fish_group_by_keys: ['location', 'shadow_size'],
    fish_group_by: null,
    current_hour_fish_group_by: null,

    bug_group_by_keys: ['location'],
    bug_group_by: null,
    current_hour_bug_group_by: null,

    fish_search: '',
    current_hour_fish_search: '',
    bug_search: '',
    current_hour_bug_search: '',

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
        filterable: true,
        value: 'name',
      },
      { text: 'Price', filterable: false, value: 'price', filterable: false },
      { text: 'Location', filterable: false, value: 'location' },
      { text: 'Shadow Size', filterable: false, value: 'shadow_size' },
      { text: 'Time Range', filterable: false, value: 'time' },
      { text: 'Months', filterable: false, value: 'month_names' },
      { text: 'Hemisphere', filterable: false, value: 'hemisphere' },
      { text: 'Donated?', filterable: false, value: 'donated' },
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
        filterable: true,
        value: 'name',
      },
      { text: 'Price', filterable: false, value: 'price' },
      { text: 'Location', filterable: false, value: 'location' },
      { text: 'Time Range', filterable: false, value: 'time' },
      { text: 'Months', filterable: false, value: 'month_names' },
      { text: 'Hemisphere', filterable: false, value: 'hemisphere' },
      { text: 'Donated?', filterable: false, value: 'donated' },
    ],

  },

  methods: {
    getFishData: function() {
      var vm = this;
      $.ajax({
        url: 'https://raw.githubusercontent.com/gohkhoonhiang/ac_nh_critters/master/data/combined_fish.json',
        method: 'GET'
      }).then(function (data) {
        var fish_data = JSON.parse(data).data;
        var formatted_data = fish_data.map(function(row) {
          var updated_row = row;
          updated_row.month_names = convertMonths(row.months);
          updated_row.hemisphere = normalizeHemisphere(row.hemisphere);
          updated_row.donated = hasElement(vm.donated_fishes, updated_row.name);
          return updated_row;
        });

        vm.fish_data = formatted_data;
      });
    },

    getBugData: function() {
      var vm = this;
      $.ajax({
        url: 'https://raw.githubusercontent.com/gohkhoonhiang/ac_nh_critters/master/data/combined_bug.json',
        method: 'GET'
      }).then(function (data) {
        var bug_data = JSON.parse(data).data;
        var formatted_data = bug_data.map(function(row) {
          var updated_row = row;
          updated_row.month_names = convertMonths(row.months);
          updated_row.hemisphere = normalizeHemisphere(row.hemisphere);
          updated_row.donated = hasElement(vm.donated_bugs, updated_row.name);
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

    filterThisMonth: function(data, selected_hemispheres, new_this_month) {
      var vm = this;
      var this_month = vm.now.getMonth() + 1;
      return data.filter(row => row.months.includes(this_month) && selected_hemispheres.includes(row.hemisphere) && (!new_this_month || vm.newThisMonth(row)));
    },

    filterComplete: function(data, selected_hemispheres, month_filter) {
      var vm = this;
      return data.filter(row => selected_hemispheres.includes(row.hemisphere) && (!month_filter || month_filter.length === 0 || row.month_names.some(m => month_filter.includes(m))));
    },

    filterFishData: function() {
      var vm = this;
      vm.current_hour_fish_data = vm.filterCurrentHour(vm.fish_data, vm.fish_lookup_time, vm.toggle_fish_hemisphere);
      vm.outgoing_fish_data = vm.filterOutgoing(vm.fish_data, vm.toggle_fish_hemisphere);
      vm.incoming_fish_data = vm.filterIncoming(vm.fish_data, vm.toggle_fish_hemisphere);
      vm.this_month_fish_data = vm.filterThisMonth(vm.fish_data, vm.toggle_fish_hemisphere, vm.toggle_fish_new_this_month);
      vm.complete_fish_data = vm.filterComplete(vm.fish_data, vm.toggle_fish_hemisphere, vm.fish_month_filter);
    },

    filterBugData: function() {
      var vm = this;
      vm.current_hour_bug_data = vm.filterCurrentHour(vm.bug_data, vm.bug_lookup_time, vm.toggle_bug_hemisphere);
      vm.outgoing_bug_data = vm.filterOutgoing(vm.bug_data, vm.toggle_bug_hemisphere);
      vm.incoming_bug_data = vm.filterIncoming(vm.bug_data, vm.toggle_bug_hemisphere);
      vm.this_month_bug_data = vm.filterThisMonth(vm.bug_data, vm.toggle_bug_hemisphere, vm.toggle_bug_new_this_month);
      vm.complete_bug_data = vm.filterComplete(vm.bug_data, vm.toggle_bug_hemisphere, vm.bug_month_filter);
    },

    newThisMonth: function(row) {
      var vm = this;
      var last_month = vm.now.getMonth();
      var this_month = vm.now.getMonth() + 1;
      return !row.months.includes(last_month) && row.months.includes(this_month);
    },

    highlightPrice: function(price, price_threshold) {
      if (price >= price_threshold) {
        return '#e76e60';
      } else {
        return 'white';
      }
    },

    updateDonatedFish: function(row) {
      var vm = this;
      if (row.donated) {
        if (!hasElement(vm.donated_fishes, row.name)) {
          vm.donated_fishes = addElement(vm.donated_fishes, row.name);
        }
      } else {
        if (hasElement(vm.donated_fishes, row.name)) {
          vm.donated_fishes = removeElement(vm.donated_fishes, row.name);
        }
      }
    },

    updateDonatedBug: function(row) {
      var vm = this;
      if (row.donated) {
        if (!hasElement(vm.donated_bugs, row.name)) {
          vm.donated_bugs = addElement(vm.donated_bugs, row.name);
        }
      } else {
        if (hasElement(vm.donated_bugs, row.name)) {
          vm.donated_bugs = removeElement(vm.donated_bugs, row.name);
        }
      }
    },

    clearCurrentHourFishFilters: function() {
      var vm = this;
      vm.current_hour_fish_search = '';
      vm.fish_lookup_time_input = '';
    },

    clearAllFishFilters: function() {
      var vm = this;
      vm.fish_search = '';
      vm.fish_month_filter = null;
    },

    clearCurrentHourBugFilters: function() {
      var vm = this;
      vm.current_hour_bug_search = '';
      vm.bug_lookup_time_input = '';
    },

    clearAllBugFilters: function() {
      var vm = this;
      vm.bug_search = '';
      vm.bug_month_filter = null;
    },

    retrieveSettings: function() {
      var vm = this;
      var settings = JSON.parse(localStorage.getItem('ac_nh_critters_settings'));
      if (!settings) { return; }

      for (var property in settings) {
        vm[property] = settings[property];
      }
    },

    storeSettings: function() {
      var vm = this;
      var settings = {
        data_version: vm.data_version,
        fish_data: vm.fish_data,
        northern_fish_data: vm.northern_fish_data,
        southern_fish_data: vm.southern_fish_data,
        current_hour_fish_data: vm.current_hour_fish_data,
        outgoing_fish_data: vm.outgoing_fish_data,
        incoming_fish_data: vm.incoming_fish_data,
        this_month_fish_data: vm.this_month_fish_data,
        complete_fish_data: vm.complete_fish_data,
        bug_data: vm.bug_data,
        northern_bug_data: vm.northern_bug_data,
        southern_bug_data: vm.southern_bug_data,
        current_hour_bug_data: vm.current_hour_bug_data,
        outgoing_bug_data: vm.outgoing_bug_data,
        incoming_bug_data: vm.incoming_bug_data,
        this_month_bug_data: vm.this_month_bug_data,
        complete_bug_data: vm.complete_bug_data,
        toggle_fish_hemisphere: vm.toggle_fish_hemisphere,
        toggle_bug_hemisphere: vm.toggle_bug_hemisphere,
        fish_high_price_threshold: vm.fish_high_price_threshold,
        bug_high_price_threshold: vm.bug_high_price_threshold,
        fish_month_filter: vm.fish_month_filter,
        bug_month_filter: vm.bug_month_filter,
        fish_group_by: vm.fish_group_by,
        current_hour_fish_group_by: vm.current_hour_fish_group_by,
        bug_group_by: vm.bug_group_by,
        current_hour_bug_group_by: vm.current_hour_bug_group_by,
        donated_fishes: vm.donated_fishes,
        donated_bugs: vm.donated_bugs,
      };

      localStorage.setItem('ac_nh_critters_settings', JSON.stringify(settings));
    },

    resetSettings: function() {
      localStorage.removeItem('ac_nh_critters_settings');
    },

  },

  watch: {
    data_version: function(new_val, old_val) {
      var vm = this;
      if (new_val !== old_val) {
        vm.storeSettings();
      }
    },

    fish_data: function(new_val, old_val) {
      var vm = this;
      if (new_val.length > 0) {
        vm.filterFishData();
        vm.storeSettings();
      }
    },

    bug_data: function(new_val, old_val) {
      var vm = this;
      if (new_val.length > 0) {
        vm.filterBugData();
        vm.storeSettings();
      }
    },

    fish_lookup_time_input: function(new_val, old_val) {
      var vm = this;
      if (new_val) {
        vm.fish_lookup_time = generateDate(new_val);
      } else {
        vm.fish_lookup_time = vm.now;
      }
      vm.filterFishData();
      vm.storeSettings();
    },

    bug_lookup_time_input: function(new_val, old_val) {
      var vm = this;
      if (new_val) {
        vm.bug_lookup_time = generateDate(new_val);
      } else {
        vm.bug_lookup_time = vm.now;
      }
      vm.filterBugData();
      vm.storeSettings();
    },

    toggle_fish_hemisphere: function(new_val, old_val) {
      var vm = this;
      vm.filterFishData();
      vm.storeSettings();
    },

    toggle_fish_new_this_month: function(new_val, old_val) {
      var vm = this;
      vm.filterFishData();
      vm.storeSettings();
    },

    toggle_bug_hemisphere: function(new_val, old_val) {
      var vm = this;
      vm.filterBugData();
      vm.storeSettings();
    },

    toggle_bug_new_this_month: function(new_val, old_val) {
      var vm = this;
      vm.filterBugData();
      vm.storeSettings();
    },

    fish_high_price_threshold: function(new_val, old_val) {
      var vm = this;
      vm.storeSettings();
    },

    bug_high_price_threshold: function(new_val, old_val) {
      var vm = this;
      vm.storeSettings();
    },

    fish_month_filter: function(new_val, old_val) {
      var vm = this;
      vm.filterFishData();
      vm.storeSettings();
    },

    bug_month_filter: function(new_val, old_val) {
      var vm = this;
      vm.filterBugData();
      vm.storeSettings();
    },

    fish_group_by: function(new_val, old_val) {
      var vm = this;
      vm.storeSettings();
    },

    current_hour_fish_group_by: function(new_val, old_val) {
      var vm = this;
      vm.storeSettings();
    },

    bug_group_by: function(new_val, old_val) {
      var vm = this;
      vm.storeSettings();
    },

    current_hour_bug_group_by: function(new_val, old_val) {
      var vm = this;
      vm.storeSettings();
    },

    donated_fishes: function(new_val, old_val) {
      var vm = this;
      vm.storeSettings();
    },

    donated_bugs: function(new_val, old_val) {
      var vm = this;
      vm.storeSettings();
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

    new_this_month: function(value) {
      if (!value) {
        return '';
      }

      var now = new Date();
      var last_month = now.getMonth();
      var this_month = now.getMonth() + 1;
      if (!value.months.includes(last_month) && value.months.includes(this_month)) {
          return `${value.name} (NEW!)`;
      } else {
          return value.name;
      }
    }
  },
});
