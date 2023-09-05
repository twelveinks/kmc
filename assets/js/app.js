const datepicker=require('js-datepicker');
const picker = datepicker(document.querySelector('#datetimepicker'),{
    // Event callbacks.
    onSelect: function(instance) {
        // Show which date was selected.
        console.log(instance.dateSelected);
      },
      onShow: function(instance) {
        console.log('Calendar showing.');
      },
      onHide: function(instance) {
        console.log('Calendar hidden.');
      },
      onMonthChange: function(instance) {
        // Show the month of the selected date.
        console.log(instance.currentMonthName);
      }
})
    