class GalleryManager {
    constructor() {
        this.galleryData = [];
        this.galleryContainer = document.querySelector('#gallery-container');
    }

    async initialize() {
        try {
            // Fetch gallery data from CSV file
            const response = await fetch('CSV_info/GalleryEvents.csv');
            const csvText = await response.text();
            this.galleryData = this.parseCSV(csvText);
            
            // Convert date strings to Date objects and sort by date
            this.galleryData.forEach(event => {
                event.Date = new Date(event.Date);
            });
            this.galleryData.sort((a, b) => b.Date - a.Date);
            
            this.updateGalleryContent();
        } catch (error) {
            console.error('Error initializing gallery:', error);
        }
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        
        return lines.slice(1)
            .filter(line => line.trim() !== '')
            .map(line => {
                const values = [];
                let currentValue = '';
                let insideQuotes = false;
                
                // Parse each character to handle quoted values
                for (let char of line) {
                    if (char === '"') {
                        insideQuotes = !insideQuotes;
                    } else if (char === ',' && !insideQuotes) {
                        values.push(currentValue.trim());
                        currentValue = '';
                    } else {
                        currentValue += char;
                    }
                }
                // Push the last value
                values.push(currentValue.trim());
                
                // Create object with headers
                const event = {};
                headers.forEach((header, index) => {
                    // Remove any surrounding quotes
                    let value = values[index] || '';
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1);
                    }
                    event[header] = value;
                });
                return event;
            });
    }

    updateGalleryContent() {
        // Group events by year
        const years = [...new Set(this.galleryData.map(event => 
            event.Date.getFullYear()))];
        
        years.forEach(year => {
            // Handle Autumn semester (Aug-Dec)
            const autumnEvents = this.galleryData.filter(event => 
                event.Date.getFullYear() === year && 
                event.Date.getMonth() >= 7 && 
                event.Date.getMonth() <= 11
            );
            
            if (autumnEvents.length > 0) {
                this.createSemesterSection('Autumn', year, autumnEvents);
            }
            
            // Handle Spring semester (Jan-May)
            const springEvents = this.galleryData.filter(event => 
                event.Date.getFullYear() === year && 
                event.Date.getMonth() >= 0 && 
                event.Date.getMonth() <= 4
            );
            
            if (springEvents.length > 0) {
                this.createSemesterSection('Spring', year, springEvents);
            }
        });
    }

    async createSemesterSection(semester, year, events) {
        const sectionDiv = document.createElement('div');
        sectionDiv.innerHTML = `
            <div class="container"></div>
            <div class="break"></div>
            <h1 class="fw-bold text-center sase-blue-text">${semester} ${year}</h1>
            <div class="break"></div>
        `;
        this.galleryContainer.appendChild(sectionDiv);

        // Create rows of 3 events
        for (let i = 0; i < events.length; i += 3) {
            const rowEvents = events.slice(i, i + 3);
            await this.createGalleryRow(rowEvents, i);
        }
    }

    async createGalleryRow(events, startIndex) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'row mb-3 mx-3';
        
        // Use Promise.all to wait for all cards to be created
        const cardPromises = events.map(async (event, index) => {
            const eventNum = startIndex + index + 1;
            return await this.createEventCard(event, eventNum);
        });
        
        const cards = await Promise.all(cardPromises);
        cards.forEach(card => rowDiv.appendChild(card));
        
        this.galleryContainer.appendChild(rowDiv);
    }

    getEventImages(event) {
        const eventImages = [];
        if (event['Num of Pics'] > 0) {
            for (let i = 1; i <= event['Num of Pics']; i++) {
                eventImages.push(`../../images/Gallery/${event.Name}${i}.png`);
            }
        } else {
            eventImages.push('../../images/sase_logo.png');
        }
        return eventImages;
    }

    async createEventCard(event, eventNum) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'col-sm-4 themed-grid-col';
        
        const images = this.getEventImages(event);
        const formattedDate = event.Date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
        });

        cardDiv.innerHTML = `
            <div class="card">
                <div id="event${eventNum}Carousel" class="carousel slide" data-bs-ride="carousel" data-bs-interval="5000">
                    <div class="carousel-inner">
                        ${images.map((img, idx) => `
                            <div class="carousel-item${idx === 0 ? ' active' : ''}">
                                <img class="d-block w-100 carousel-image" src="${img}" alt="">
                            </div>
                        `).join('')}
                    </div>
                    ${images.length > 1 ? `
                    <button class="carousel-control-prev" type="button" data-bs-target="#event${eventNum}Carousel" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Previous</span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#event${eventNum}Carousel" data-bs-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Next</span>
                    </button>
                    ` : ''}
                </div>
                <div class="card-body">
                    <h5 class="card-title">${event.Name}</h5>
                    <p class="text-secondary mb-2">${formattedDate}</p>
                    <p class="card-text">${event.Description}</p>
                </div>
            </div>
        `;
        
        return cardDiv;
    }
}

// Initialize gallery when page loads
document.addEventListener('DOMContentLoaded', () => {
    const gallery = new GalleryManager();
    gallery.initialize();
});



