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
    fish_data: [],
    northern_fish_data: [],
    southern_fish_data: [],
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
    grouped_fish_headers: [
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
    ],
    bug_data: [],
    northern_bug_data: [],
    southern_bug_data: [],
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
    grouped_bug_headers: [
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
        vm.northern_fish_data = formatted_data.filter(row => row.hemisphere === 'N').map(function(row) {
          var cloned = Object.assign({}, row);
          delete cloned.hemisphere;
          return cloned;
        });
        vm.southern_fish_data = formatted_data.filter(row => row.hemisphere === 'S').map(function(row) {
          var cloned = Object.assign({}, row);
          delete cloned.hemisphere;
          return cloned;
        });
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
        vm.northern_bug_data = formatted_data.filter(row => row.hemisphere === 'N').map(function(row) {
          var cloned = Object.assign({}, row);
          delete cloned.hemisphere;
          return cloned;
        });
        vm.southern_bug_data = formatted_data.filter(row => row.hemisphere === 'S').map(function(row) {
          var cloned = Object.assign({}, row);
          delete cloned.hemisphere;
          return cloned;
        });
      });
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
