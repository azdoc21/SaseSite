document.addEventListener('DOMContentLoaded', async function() {
    // Fetch and parse the CSV file
    const response = await fetch('../CSV_info/UpcomingEvents.csv');
    const csvText = await response.text();
    console.log('Raw CSV text:', csvText);
    const events = parseCSV(csvText);
    console.log('Raw CSV events:', events);

    // Filter and sort events
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const futureEvents = events
        .filter(event => new Date(event.Date) > currentDate)
        .sort((a, b) => new Date(a.Date) - new Date(b.Date));

    console.log('Filtered future events:', futureEvents);

    // Generate HTML for cards and modals
    let cardsHtml = '';
    let modalsHtml = '';
    let currentMonth = null;

    futureEvents.forEach((event, index) => {
        // Keep the original date format from CSV
        const originalDate = event.Date; // Store the original MM/DD/YYYY format
        
        // Create a date object for display purposes only
        const eventDate = new Date(event.Date);
        const monthYear = eventDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const displayDate = eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

        // Add month header if it's a new month
        if (monthYear !== currentMonth) {
            currentMonth = monthYear;
            cardsHtml += `<h4 id="today" class="text-white mx-2" style="font-weight: bold;">${monthYear}</h4>\n\n`;
        }

        const [cardHtml, modalHtml] = generateEventHtml(
            index + 1,
            event.Name,
            originalDate,  // Pass the original date format
            displayDate,   // Pass the display format
            event.Kind,
            event.Time,
            event.Location,
            event.Description
        );

        cardsHtml += cardHtml + '\n\n';
        modalsHtml += modalHtml + '\n\n';
    });

    // Update the DOM
    updateCalendarContent(cardsHtml, modalsHtml);
});

function parseCSV(csvText) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;
    
    console.log('Starting CSV parse');
    
    // Process each character in the CSV text
    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        
        if (char === '"') {
            if (!insideQuotes) {
                insideQuotes = true;
            } else if (csvText[i + 1] === ',' || csvText[i + 1] === '\n' || csvText[i + 1] === '\r') {
                insideQuotes = false;
            } else {
                currentField += char;
            }
        } else if (char === ',' && !insideQuotes) {
            currentRow.push(currentField.trim());
            currentField = '';
        } else if ((char === '\n' || (char === '\r' && csvText[i + 1] === '\n')) && !insideQuotes) {
            currentRow.push(currentField.trim());
            if (currentRow.length > 0 && currentRow.some(field => field)) {
                console.log('Adding row:', currentRow);
                rows.push(currentRow);
            }
            currentRow = [];
            currentField = '';
            if (char === '\r') i++; // Skip the \n if we found \r\n
        } else if (char !== '\r') { // Skip lone \r
            currentField += char;
        }
    }
    
    // Handle the last field/row if any
    if (currentField) {
        currentRow.push(currentField.trim());
    }
    if (currentRow.length > 0 && currentRow.some(field => field)) {
        console.log('Adding final row:', currentRow);
        rows.push(currentRow);
    }

    console.log('Total rows found:', rows.length);

    // Convert to array of objects using headers
    const headers = rows[0];
    const result = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        return obj;
    });

    console.log('Parsed objects:', result);
    return result;
}

function generateEventHtml(eventNum, name, originalDate, displayDate, kind, time, location, description) {
    console.log('generateEventHtml input:', {
        eventNum,
        name,
        originalDate,
        displayDate,
        kind,
        time,
        location,
        description
    });
    
    const cardHtml = `
        <div class="row rounded-3 bg-white my-4 py-3 px-2 align-middle">
            <div class="col-sm-8 rounded-3 align-middle">
              <p class="text-uppercase sase-blue-text">${kind}</p>
              <h5 style="font-weight: bold; margin-top: -13px;">${name}</h5>
              <button type="button" class="btn bg-body-tertiary rounded-pill" data-bs-toggle="modal" data-bs-target="#event${eventNum}Modal" style="font-size: small;">
                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15" height="15" viewBox="0,15,256,256">
                  <g fill="#000000" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(8.53333,8.53333)"><path d="M15,3c-6.627,0 -12,5.373 -12,12c0,6.627 5.373,12 12,12c6.627,0 12,-5.373 12,-12c0,-6.627 -5.373,-12 -12,-12zM16,16h-8.005c-0.55,0 -0.995,-0.445 -0.995,-0.995v-0.011c0,-0.549 0.445,-0.994 0.995,-0.994h6.005v-8.005c0,-0.55 0.445,-0.995 0.995,-0.995h0.011c0.549,0 0.994,0.445 0.994,0.995z"></path></g></g>
                </svg>   ${displayDate}
              </button>
            </div>
            <div class="col-sm-4 rounded-3 d-flex align-items-center justify-content-end">
              <button type="button" class="btn btn-primary text-uppercase" data-bs-toggle="modal" data-bs-target="#event${eventNum}Modal">
                Get Details
              </button>
            </div>
        </div>`;

    const modalHtml = `
    <div class="modal fade" id="event${eventNum}Modal" tabindex="-1" aria-labelledby="event${eventNum}ModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <div class="text-center w-100">
              <p class="text-uppercase sase-blue-text">${kind}</p>
              <h1 class="modal-title fs-4" id="event${eventNum}ModalLabel" style="font-weight: bold; margin-top: -13px;">${name}</h1>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>${description}</p>
            <p class="text-uppercase"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 30 512 512" class="small-icon"><path d="M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zM232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"/></svg>   When</p>
            <p class="event-descript">${displayDate} @ ${time}</p>
            <p class="text-uppercase"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="small-icon"><path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>  Where</p>
            <p class="event-descript">${location}</p>
            <p class="sase-blue-text">
                <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(name)}&details=${encodeURIComponent(description)}&dates=${formatDateForCalendar(originalDate, time).start}/${formatDateForCalendar(originalDate, time).end}&location=${encodeURIComponent(location)}">Add to Google Calendar</a>
                |
                <a href="${generateICSCalendarLink(name, description, originalDate, time, location)}" download="${name.replace(/\s+/g, '_')}.ics">Add to ICalender</a>
                |
                <a href="https://outlook.office.com/calendar/action/compose?subject=${encodeURIComponent(name)}&body=${encodeURIComponent(description)}&startdt=${formatDateForOutlook(originalDate, time)}&location=${encodeURIComponent(location)}">Add to Outlook</a>
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>`;

    return [cardHtml, modalHtml];
}

function formatDateForCalendar(date, time) {
    try {
        console.log('formatDateForCalendar input:', { date, time });
        
        if (!date || !time) {
            console.error('Missing date or time:', { date, time });
            return { start: '', end: '' };
        }

        // Parse the MM/DD/YYYY format
        const [month, day, year] = date.split('/');
        if (!month || !day || !year) {
            console.error('Invalid date format:', date);
            return { start: '', end: '' };
        }

        const eventDate = new Date(year, parseInt(month) - 1, parseInt(day));

        // Parse time (format: "6:00 - 8:00 PM")
        const [timeRange, period] = time.split(' PM').filter(Boolean); // Split on 'PM' specifically
        const [startTime, endTime] = timeRange.trim().split(' - ');

        // Parse start time
        let [startHours, startMinutes] = startTime.split(':').map(num => parseInt(num));
        
        // Parse end time
        let [endHours, endMinutes] = endTime.split(':').map(num => parseInt(num));

        // Convert to 24-hour format (we know it's PM from the CSV format)
        if (startHours !== 12) startHours += 12;
        if (endHours !== 12) endHours += 12;

        // Create start and end datetime objects
        const startDateTime = new Date(eventDate);
        const endDateTime = new Date(eventDate);
        
        startDateTime.setHours(startHours, startMinutes, 0, 0);
        endDateTime.setHours(endHours, endMinutes, 0, 0);

        // Format for calendar
        const formatToString = (date) => {
            return date.toISOString().replace(/[-:]/g, '').slice(0, 15) + '00Z';
        };

        return {
            start: formatToString(startDateTime),
            end: formatToString(endDateTime)
        };
    } catch (error) {
        console.error('Error formatting date:', error);
        console.error('Input values:', { date, time });
        return { start: '', end: '' };
    }
}

function generateICSCalendarLink(name, description, date, time, location) {
  // Implementation needed for ICS calendar link generation
  return '';
}

function formatDateForOutlook(date, time) {
    try {
        console.log('Formatting for Outlook:', { date, time });

        // Parse the date
        let eventDate;
        if (date.includes(',')) {
            // Handle "Month Day, Year" format
            eventDate = new Date(date);
        } else if (date.includes('/')) {
            // Handle "MM/DD/YYYY" format
            const [month, day, year] = date.split('/');
            eventDate = new Date(year, parseInt(month) - 1, parseInt(day));
        } else {
            // Handle "Month Day" format without year
            const currentYear = new Date().getFullYear();
            eventDate = new Date(`${date}, ${currentYear}`);
        }

        if (isNaN(eventDate.getTime())) {
            console.error('Failed to parse date:', date);
            return '';
        }

        // Parse the time
        const [timeRange, period] = time.split(' ').filter(Boolean);
        const [startTime] = timeRange.split(' - ');
        let [hours, minutes] = startTime.split(':').map(num => parseInt(num));
        
        // Convert to 24-hour format
        if (period === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }
        
        // Set the time
        eventDate.setHours(hours, minutes, 0, 0);
        
        // Format for Outlook (yyyy-mm-ddThh:mm:ss)
        return eventDate.toISOString().slice(0, 19);
    } catch (error) {
        console.error('Error formatting date for Outlook:', error);
        return '';
    }
}

function updateCalendarContent(cardsHtml, modalsHtml) {
    const cardsContainer = document.getElementById('cardsContainer');
    const modalsContainer = document.getElementById('modalsContainer');

    cardsContainer.innerHTML = cardsHtml;
    modalsContainer.innerHTML = modalsHtml;
}

//Countdown Clock

var countDownDate = new Date("Nov 1, 2024 18:00:00").getTime();

const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Update the count down every 1 second
var x = setInterval(function() {

  // Get today's date and time
  var now = new Date().getTime();
    
  // Find the distance between now and the count down date
  var distance = countDownDate - now;
    
  // Time calculations for days, hours, minutes and seconds
  var days = Math.floor(distance / (1000 * 60 * 60 * 24));
  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
  // Output the result in an element with id="demo"
  document.getElementById("Countdown").innerHTML = days + "d " + hours + "h "
  + minutes + "m " + seconds + "s ";
    
  // If the count down is over, write some text 
  if (distance < 0) {
    clearInterval(x);
    document.getElementById("Countdown").innerHTML = "Career Fiar Prep with P&G!";
  }
}, 1000);
