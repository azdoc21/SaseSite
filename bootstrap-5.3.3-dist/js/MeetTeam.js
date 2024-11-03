document.addEventListener('DOMContentLoaded', function() {
    console.log('Script loaded');
    const container = document.querySelector('#eboard-container');
    console.log('Container found:', container);
    // Get the current year for image path construction
    const currentYear = new Date().getFullYear();
    const yearSuffix = `${String(currentYear).slice(-2)}-${String(currentYear + 1).slice(-2)}`;

    // Fetch the CSV data
    fetch('../../images/EBoard/CurrentBoard.csv')
        .then(response => response.text())
        .then(csvText => {
            console.log('CSV loaded:', csvText); // Add debugging
            // Parse CSV (simple implementation - assumes well-formed CSV)
            const rows = csvText.split('\n')
                .filter(row => row.trim()) // Remove empty rows
                .slice(1); // Skip header row
            
            console.log('Parsed rows:', rows); // Add debugging
            
            // Create container
            const cards = document.createElement('div');
            cards.className = 'container-fluid p-3';
            const BigRow = document.createElement('div');
            BigRow.className = 'row gy-4';
            
            // Initialize tracking variables
            let currentPosition = '';
            const positionCount = {};
            
            rows.forEach((row, index) => {
                const fields = row.split(',').map(field => field.trim());
                
                if (!fields[0] || !fields[1]) {
                    console.error('Missing required fields:', fields);
                    return;
                }
                
                const position = fields[0];
                const name = fields[1];
                const major = fields[2] || '';
                const email = fields[3] || '';
                const year = fields[4] || '';
                const linkedin = fields[5] || '';
                
                // Handle position grouping
                const basePosition = position.replace('Co-', '');
                if (basePosition !== currentPosition) {
                    // Create a comment node instead of using innerHTML
                    const positionHeader = document.createComment(` ${basePosition}(s) `);
                    BigRow.appendChild(positionHeader);
                    
                    currentPosition = basePosition;
                    positionCount[basePosition] = 0;
                }
                
                // Update position count
                positionCount[basePosition] = (positionCount[basePosition] || 0) + 1;

                // Generate card ID
                const cardId = position.startsWith('Co-') 
                    ? `${basePosition.toLowerCase().replace(' ', '').slice(0, 4)}${positionCount[basePosition]}`
                    : basePosition.toLowerCase().replace(' ', '');

                // Create card HTML
                const cardHtml = generateEboardCard(position, name, major, email, year, linkedin, cardId, yearSuffix);
                BigRow.insertAdjacentHTML('beforeend', cardHtml);
                
                console.log(`Added card for ${name} (${position})`);
            });

            cards.appendChild(BigRow);

            // Replace content
            if (container) {
                container.innerHTML = '';
                container.appendChild(cards);
            }
        })
        .catch(error => console.error('Error loading E-Board data:', error));
});

function generateEboardCard(position, name, major, email, year, linkedin, cardId, yearSuffix) {
    if (!name) {
        console.error('Name is missing for card:', {position, major, email, year, linkedin});
        return '';
    }
    
    // Debug the image path construction
    const [firstName, lastName] = name.split(' ');
    const imagePath = `../images/Eboard/Eboard${yearSuffix}/${firstName}_${lastName}.png`;
    console.log('Generated image path:', imagePath);
    
    return `
          <div class="col-md-4 col-lg-3">
            <div class="card">
              <img src="${imagePath}" class="card-img-top" alt="${name}">
              <div class="card-body">
                <h2 class="card-title text-center fw-bold">${position}</h2>
                <h5 class="card-title text-center">${name}</h5> 
                <div class="text-center">
                  <button class="btn sase-blue text-white my-2" type="button" data-bs-toggle="collapse" data-bs-target="#${cardId}-info" aria-expanded="false" aria-controls="${cardId}-info">
                    About
                  </button>
                </div>
                <div class="collapse" id="${cardId}-info">
                  <div class="card card-body">
                    <p class="text-start my-auto">
                      Year: ${year}<br>
                      Major: ${major}<br>
                      Email: <a href="mailto:${email}">${email}</a><br>
                      Linkedin: <a href="${linkedin}" target="_blank">Connect</a></p>
                  </div>
                </div>
              </div>
            </div>
          </div>\n\n
    `;
}
