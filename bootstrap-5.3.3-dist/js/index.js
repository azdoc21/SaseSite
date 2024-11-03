document.addEventListener('DOMContentLoaded', async function() {
    // Helper function to parse CSV with quoted fields and newlines
    function parseCSVLine(text) {
        const result = [];
        let cell = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < text.length) {
            const char = text[i];
            
            if (char === '"') {
                if (inQuotes && text[i + 1] === '"') {
                    // Handle escaped quotes
                    cell += '"';
                    i++;
                } else {
                    // Toggle quotes mode
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // End of cell
                result.push(cell.trim());
                cell = '';
            } else {
                cell += char;
            }
            i++;
        }
        
        // Push the last cell
        result.push(cell.trim());
        return result;
    }

    async function fetchCSV(file) {
        const response = await fetch(file);
        const csvText = await response.text();
        
        // Split into rows, preserving newlines in quoted fields
        const rows = [];
        let currentRow = '';
        let inQuotes = false;
        
        csvText.split(/\r?\n/).forEach(line => {
            const quotesCount = (line.match(/"/g) || []).length;
            if (!inQuotes && quotesCount % 2 === 1) {
                inQuotes = true;
                currentRow = line;
            } else if (inQuotes && quotesCount % 2 === 1) {
                inQuotes = false;
                currentRow += '\n' + line;
                rows.push(currentRow);
                currentRow = '';
            } else if (inQuotes) {
                currentRow += '\n' + line;
            } else {
                rows.push(line);
            }
        });

        const headers = parseCSVLine(rows[0]);
        
        return rows.slice(1)
            .filter(row => row.trim())
            .map(row => {
                const values = parseCSVLine(row);
                return headers.reduce((obj, header, index) => {
                    obj[header] = values[index] || '';
                    return obj;
                }, {});
            });
    }

    // Process announcements
    async function updateAnnouncements() {
        try {
            const announcements = await fetchCSV('../../CSV_info/Announcements.csv');
            const announcementsContainer = document.querySelector('#announcements-container');
            
            // Create a row div to contain the announcements
            announcementsContainer.innerHTML = '<div class="row">';
            
            // Sort by date descending and get most recent 2
            const sortedAnnouncements = announcements
                .map(a => ({
                    ...a,
                    Date: new Date(a.Date.split('-').reverse().join('-'))
                }))
                .filter(a => a.Date <= new Date())
                .sort((a, b) => b.Date - a.Date)
                .slice(0, 2);

            sortedAnnouncements.forEach(announcement => {
                const formattedDate = announcement.Date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                announcementsContainer.querySelector('.row').innerHTML += generateAnnouncementCard(
                    announcement.Name,
                    formattedDate,
                    announcement.Description,
                    announcement.Image,
                    announcement['Link Button'],
                    announcement.Link
                );
            });
            
            // Close the row div
            announcementsContainer.innerHTML += '</div>';
        } catch (error) {
            console.error('Error updating announcements:', error);
        }
    }

    // Process events
    async function updateEvents() {
        try {
            const events = await fetchCSV('../../CSV_info/UpcomingEvents.csv');
            const eventsContainer = document.querySelector('#events-container');
            
            // Filter and sort future events
            const currentDate = new Date();
            const futureEvents = events
                .map(e => {
                    try {
                        // Parse MM/DD/YYYY format
                        const [month, day, year] = e.Date.split('/');
                        return {
                            ...e,
                            Date: new Date(year, month - 1, day) // month is 0-based in JS
                        };
                    } catch (error) {
                        console.warn(`Invalid date format for event: ${e.Name}`);
                        return null;
                    }
                })
                .filter(e => e && e.Date && e.Date > currentDate)
                .sort((a, b) => a.Date - b.Date)
                .slice(0, 3);

            // Clear existing content and create row
            eventsContainer.innerHTML = '<div class="row">';
            
            // Display up to 3 events, fill with placeholders if needed
            const numEvents = Math.min(futureEvents.length, 3);
            
            for (let i = 0; i < 3; i++) {
                if (i < numEvents && futureEvents[i]) {
                    const formattedDate = futureEvents[i].Date.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric'
                    });
                    
                    eventsContainer.querySelector('.row').innerHTML += generateEventPreview(
                        futureEvents[i].Name,
                        formattedDate,
                        futureEvents[i].Description
                    );
                } else {
                    eventsContainer.querySelector('.row').innerHTML += generateEventPreview(
                        "TBD",
                        "X XX, XXXX",
                        "Check back in for more information on upcoming events"
                    );
                }
            }

            // Close the row
            eventsContainer.innerHTML += '</div>';
        } catch (error) {
            console.error('Error updating events:', error);
        }
    }

    async function updateCarousel() {
        try {
            const carousel = await fetchCSV('../../CSV_info/Carousel.csv');
            console.log(carousel);
            const carouselInner = document.querySelector('.carousel-inner');
            carouselInner.innerHTML = '';

            // Add first item as active
            if (carousel.length > 0) {
                const firstItem = carousel[0];
                carouselInner.innerHTML += `
                <div class="carousel-item active">
                    <img src="images/Carousel/${firstItem['Image']}" class="d-block w-100" alt="${firstItem['Image Title']}">
                    <div class="carousel-caption d-none d-md-block">
                        <div class="container-fluid bg-custom">
                            <h5>${firstItem['Title']}</h5>
                        </div>
                    </div>
                </div>`;

                // Add remaining items
                for (let i = 1; i < carousel.length; i++) {
                    const item = carousel[i];
                    carouselInner.innerHTML += `
                    <div class="carousel-item">
                        <img src="images/Carousel/${item['Image']}" class="d-block w-100" alt="${item['Image Title']}">
                        <div class="carousel-caption d-none d-md-block">
                            <div class="container-fluid bg-custom">
                                <h5>${item['Title']}</h5>
                            </div>
                        </div>
                    </div>`;
                }
            }
        } catch (error) {
            console.error('Error updating carousel:', error);
        }
    }

    function generateAnnouncementCard(name, date, description, image, linkButton, link) {
        return `
            <div class="col-md-6">
                <div class="row g-0 border rounded overflow-hidden flex-md-row mb-2 shadow-sm h-md-250 position-relative sase-green">
                    <div class="col p-4 d-flex flex-column position-static">
                        <h3 class="mb-0">${name}</h3>
                        <div class="mb-1 text-body-secondary">${date}</div>
                        <p class="card-text mb-auto">${description}</p>
                        <a href="${link || '#'}" target="_blank" class="btn btn-outline-light btn-lg my-2 rounded-0">
                            ${linkButton || 'Learn More'}
                        </a>
                    </div>
                    <div class="col-auto d-none d-lg-block">
                        <img class="announcement-pic" src="images/Announcements/${image}" alt="Announcement Image" class="w-100">
                    </div>
                </div>
            </div>`;
    }

    function generateEventPreview(name, date, description) {
        return `
            <div class="col-md-4 px-4">
                <h2 class="text-center mt-3">${name}</h2>
                <p class="text-center fs-5">${date}</p>
                <p class="py-3">${description}</p>
                <a href="pages/calender.html" class="btn sase-blue text-white" tabindex="-1" role="button" aria-disabled="false">Learn more</a>
            </div>`;
    }

    // Initialize everything
    await Promise.all([
        updateAnnouncements(),
        updateEvents(),
        updateCarousel()
    ]);
});
