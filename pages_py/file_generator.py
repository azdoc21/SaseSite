import pandas as pd
import datetime
import os
#______________________________________________________________________________
#calendar content generator
def update_calendar_content():
    # Read the original file
    with open("pages_py/calender.html", "r") as original:
        content = original.read()
        
    # Find the split point
    split_point = content.find("<!--Events-->")
    if split_point == -1:
        print("Could not find <!--Events--> comment marker")
        return
        
    # Get header content
    header_content = content[:split_point]

    # Get content between end of events and event modals
    end_events_idx = content.find("<!--End of Events-->")
    event_modals_idx = content.find("<!--Event Modals-->")
    if end_events_idx == -1 or event_modals_idx == -1:
        print("Could not find event section comment markers")
        return
    between_content = content[end_events_idx + len("<!--End of Events-->"):event_modals_idx]

    # Get footer content
    footer_idx = content.find("<!--Footer-->")
    if footer_idx == -1:
        print("Could not find footer comment marker")
        return
    footer_content = content[footer_idx:]

    # Read events from CSV into pandas dataframe
    events_df = pd.read_csv("../CSV_info/UpcomingEvents.csv")
    # Convert the Date column to datetime and then format it as string
    events_df['Date'] = pd.to_datetime(events_df['Date'], format='%d-%b-%Y')
    # Filter for future events only
    current_date = pd.Timestamp.now().normalize()
    events_df = events_df[events_df['Date'] > current_date]
    
    # Sort events by date
    events_df = events_df.sort_values('Date')
    # Format the date as YYYY-MM-DD string for the calendar links
    events_df['DateStr'] = events_df['Date'].dt.strftime('%B %d')
    
    # Initialize empty strings to store HTML
    cards_html = ""
    modals_html = ""
    
    # Iterate through events and generate HTML
    current_month = None
    for idx, row in events_df.iterrows():
        event_num = idx + 1
        # Extract month and year from the Date
        event_date = row['Date']
        month_year = event_date.strftime('%B %Y')
        
        # Add month header if it's a new month
        if month_year != current_month:
            current_month = month_year
            cards_html += f'<h4 id="today" class="text-white mx-2" style="font-weight: bold;">{month_year}</h4>\n\n'
            
        card_html, modal_html = generate_event_html(
            event_num,
            row['Name'],
            row['DateStr'],  # Use the formatted date string here
            row['Kind'], 
            row['Time'],
            row['Location'],
            row['Description']
        )
        
        cards_html += card_html + "\n\n"  # Add newlines between cards
        modals_html += modal_html + "\n\n"  # Add newlines between modals

    # Write the events section
    with open("pages_py/calender.html", "w") as calendar_file:
        calendar_file.write(header_content)
        calendar_file.write("<!--Events-->\n")
        calendar_file.write(cards_html)
        calendar_file.write("\n<!--End of Events-->")
        calendar_file.write(between_content)
        calendar_file.write("<!--Event Modals-->\n")
        calendar_file.write(modals_html)
        calendar_file.write(footer_content)

def generate_event_html(event_num, name, date, kind, time, location, description):
    # Generate the event card HTML
    card_html = f'''
        <div class="row rounded-3 bg-white my-4 py-3 px-2 align-middle">
            <div class="col-sm-8 rounded-3 align-middle">
              <p class="text-uppercase sase-blue-text">{kind}</p>
              <h5 style="font-weight: bold; margin-top: -13px;">{name}</h5>
              <button type="button" class="btn bg-body-tertiary rounded-pill" data-bs-toggle="modal" data-bs-target="#event{event_num}Modal" style="font-size: small;">
                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15" height="15" viewBox="0,15,256,256">
                  <g fill="#000000" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(8.53333,8.53333)"><path d="M15,3c-6.627,0 -12,5.373 -12,12c0,6.627 5.373,12 12,12c6.627,0 12,-5.373 12,-12c0,-6.627 -5.373,-12 -12,-12zM16,16h-8.005c-0.55,0 -0.995,-0.445 -0.995,-0.995v-0.011c0,-0.549 0.445,-0.994 0.995,-0.994h6.005v-8.005c0,-0.55 0.445,-0.995 0.995,-0.995h0.011c0.549,0 0.994,0.445 0.994,0.995z"></path></g></g>
                </svg>   {date}
              </button>
            </div>
            <div class="col-sm-4 rounded-3 d-flex align-items-center justify-content-end">
              <button type="button" class="btn btn-primary text-uppercase" data-bs-toggle="modal" data-bs-target="#event{event_num}Modal">
                Get Details
              </button>
            </div>
        </div>'''

    # Generate the modal HTML
    modal_html = f'''
    <div class="modal fade" id="event{event_num}Modal" tabindex="-1" aria-labelledby="event{event_num}ModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <div class="text-center w-100">
              <p class="text-uppercase sase-blue-text">{kind}</p>
              <h1 class="modal-title fs-4" id="event{event_num}ModalLabel" style="font-weight: bold; margin-top: -13px;">{name}</h1>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>{description}</p>
            <p class="text-uppercase"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 30 512 512" class="small-icon"><path d="M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zM232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"/></svg>   When</p>
            <p class="event-descript">{date} @ {time}</p>
            <p class="text-uppercase"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="small-icon"><path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>  Where</p>
            <p class="event-descript">{location}</p>
            <p class="sase-blue-text"><a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text={name.replace(' ', '+')}&details={description.replace(' ', '+')}&dates={date.replace('-', '')}T{time[:2]}{time[3:5]}00/{date.replace('-', '')}T{time[-8:-6]}{time[-5:-3]}00&location={location.replace(' ', '+')}">Add to Google Calendar</a></p>
            <p><a href="data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ADTSTART:{date.replace('-', '')}T{time[:2]}{time[3:5]}00%0ADTEND:{date.replace('-', '')}T{time[-8:-6]}{time[-5:-3]}00%0ASUMMARY:{name}%0ADESCRIPTION:{description}%0ALOCATION:{location}%0AEND:VEVENT%0AEND:VCALENDAR">Add to Apple Calendar</a></p>
            <p><a href="https://outlook.office.com/calendar/0/deeplink/compose?subject={name.replace(' ', '+')}&body={description.replace(' ', '+')}&startdt={date}T{time[:5]}:00+00:00&enddt={date}T{time[-8:]}+00:00&location={location.replace(' ', '+')}&path=%2Fcalendar%2Faction%2Fcompose&rru=addevent">Add to Outlook Calender</a></p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>'''

    return card_html, modal_html

#______________________________________________________________________________
#meetTeam content generator
def update_meetTeam_content():
    # Read the meetTeam.html file
    with open('pages_py/meetTeam.html', 'r') as file:
        content = file.read()

    # Find the Eboard comment boundaries
    split_point = content.find("<!--EBoard-->")
    if split_point == -1:
        print("Could not find <!--Eboard--> comment marker")
        return
        
    # Get header content
    header_content = content[:split_point + len("<!--EBoard-->")]

    footer_idx = content.find("<!--End of EBoard-->")
    if footer_idx == -1:
        print("Could not find end of EBoard comment marker")
        return
    footer_content = content[footer_idx:]

    # Read the Eboard CSV into a pandas dataframe
    eboard_df = pd.read_csv("../CSV_info/CurrentBoard.csv")
    # Initialize empty string to store all card HTML
    eboard_cards = ""
    
    # Track current position to add position header comments
    current_position = ""
    
    # Generate card for each board member
    for _, row in eboard_df.iterrows():
        # Extract position without Co- prefix for grouping
        base_position = row['Position'].replace('Co-', '')
        
        # Add position header comment if new position group
        if base_position != current_position:
            eboard_cards += f"\n          <!-- {base_position}(s) -->\n"
            current_position = base_position
            
        # Generate unique card ID based on position
        if row['Position'].startswith('Co-'):
            position_prefix = base_position.lower().replace(' ', '')[:4]
            card_id = f"{position_prefix}{len(eboard_cards.split(position_prefix)) + 1}"
        else:
            card_id = base_position.lower().replace(' ', '')
            
        # Generate card HTML
        card = generate_eboard_card(
            position=row['Position'],
            name=row['Name'], 
            major=row['Major'],
            email=row['Email'],
            year=row['Year'],
            linkedin=row['LinkedIn'],
            card_id=card_id
        )
        
        eboard_cards += card

    # Write the updated content to the meetTeam.html file
    with open('pages_py/meetTeam.html', 'w') as file:
        file.write(header_content)
        file.write(eboard_cards)
        file.write(footer_content)

def generate_eboard_card(position, name, major, email, year, linkedin, card_id):
    # Get current year and create image path string
    current_year = datetime.datetime.now().year
    image_path = f"../images/EBoard/EBoard{str(current_year)[-2:]}-{str(current_year + 1)[-2:]}/{name.split()[0]}_{name.split()[1]}.png"
    card_html = f'''          <div class="col-md-4 col-lg-3">
            <div class="card">
              <img src="{image_path}" class="card-img-top" alt="...">
              <div class="card-body">
                <h2 class="card-title text-center fw-bold">{position}</h2>
                <h5 class="card-title text-center">{name}</h5>
                <div class="text-center">
                  <button class="btn sase-blue text-white my-2" type="button" data-bs-toggle="collapse" data-bs-target="#{card_id}-info" aria-expanded="false" aria-controls="{card_id}-info">
                    About
                  </button>
                </div>
                <div class="collapse" id="{card_id}-info">
                  <div class="card card-body">
                    <p class="text-start my-auto">
                      Year: {year}<br>
                      Major: {major}<br>
                      Email: <a href="mailto:{email}">{email}</a><br>
                      Linkedin: <a href="{linkedin}" target="_blank">Connect</a></p>
                  </div>
                </div>
              </div>
            </div>
          </div>\n\n'''
    return card_html

#______________________________________________________________________________
#index content generator
def update_index_content():
    # Read the original file
    with open("index.html", "r") as original:
        content = original.read()
        
    # Find the split point
    split_point = content.find("<!--Carousel -->")
    if split_point == -1:
        print("Could not find <!--Carousel --> comment marker")
        return
        
    # Get header content
    header_content = content[:split_point]

    # Get content between end of events and event modals
    end_events_idx = content.find("<!--Navigation Bar-->")
    event_modals_idx = content.find("<!-- Announcements-->")
    if end_events_idx == -1 or event_modals_idx == -1:
        print("Could not find navigation or announcements comment markers")
        return
    between_content1 = "\n\n\t\t" + content[end_events_idx:event_modals_idx + len("<!-- Announcements-->")] + "\n"

    # Get content between end of events and event modals
    end_events_idx = content.find("<!-- End of Announcements-->")
    event_modals_idx = content.find("<!-- Sneek Peak at Events -->")
    if end_events_idx == -1 or event_modals_idx == -1:
        print("Could not find announcements or events preview comment markers")
        return
    between_content2 = "\n\n\t\t" + content[end_events_idx:event_modals_idx + len("<!-- Sneek Peak at Events -->")] + "\n"

    # Get footer content
    footer_idx = content.find("<!-- End of Sneek Peak at Events -->")
    if footer_idx == -1:
        print("Could not find end of events preview comment marker")
        return
    footer_content = "\n\t\t\t" + content[footer_idx:]

    # Get list of carousel images
    carousel_images = []
    carousel_dir = "../images/Carousel"
    if os.path.exists(carousel_dir):
        carousel_images = [f for f in os.listdir(carousel_dir) if f.endswith(('.png', '.jpg', '.jpeg'))]
    else:
        print(f"Directory {carousel_dir} not found")

    # Generate carousel HTML
    carousel_html = "<!--Carousel -->\n" + generate_carousel(carousel_images)

    # Process announcements data
    announcements_df = pd.read_csv("../CSV_info/Announcements.csv")
    announcements_df['Date'] = pd.to_datetime(announcements_df['Date'], format='%d-%b-%Y')
    current_date = pd.Timestamp.now().normalize()
    announcements_df = announcements_df[announcements_df['Date'] <= current_date]
    announcements_df = announcements_df.sort_values('Date', ascending=False)
    recent_announcements = announcements_df.head(2)
    recent_announcements['Date'] = recent_announcements['Date'].dt.strftime('%B %d, %Y')
    
    # Generate HTML for announcements
    announcements_html = ""
    for _, row in recent_announcements.iterrows():  
        announcements_html += generate_announcement_card(row['Name'], row['Date'], row['Description'], row['Image'], row['Link Button'], row['Link'])

    # Process upcoming events data
    try:
        events_df = pd.read_csv("../CSV_info/UpcomingEvents.csv")
        events_df = events_df[['Name', 'Date', 'Description']]
    except FileNotFoundError:
        print("Could not find CSV_info/UpcomingEvents.csv")
        events_df = pd.DataFrame(columns=['Name', 'Date', 'Description'])

    # Convert Date column to datetime
    events_df['Date'] = pd.to_datetime(events_df['Date'], format='%d-%b-%Y')
    
    # Filter for future events
    current_date = pd.Timestamp.now().normalize()
    future_events = events_df[events_df['Date'] > current_date]
    
    # Sort by date and get up to 3 most recent future events
    future_events = future_events.sort_values('Date').head(3)
    
    # Format dates for display
    future_events['DateStr'] = future_events['Date'].dt.strftime('%B %d')
    
    # Generate preview HTML for each event
    event_previews_html = ""
    
    # If we have less than 3 future events, add placeholder events
    num_events = len(future_events)
    if num_events < 3:
        # Add real events first
        for _, row in future_events.iterrows():
            event_previews_html += generate_event_preview(row['Name'], row['DateStr'], row['Description'])
        
        # Add placeholder events to make total of 3
        for i in range(3 - num_events):
            event_previews_html += generate_event_preview(
                "TBD",
                "X XX, XXXX", 
                "Check back in for more information on upcoming events"
            )
    else:
        # Add all 3 events if we have enough
        for _, row in future_events.iterrows():
            event_previews_html += generate_event_preview(row['Name'], row['DateStr'], row['Description'])
            
    # Write the updated content to the index.html file
    with open('index.html', 'w') as file:
        file.write(header_content)
        file.write(carousel_html)
        file.write(between_content1)
        file.write(announcements_html)  
        file.write(between_content2)
        file.write(event_previews_html)
        file.write(footer_content)

def generate_announcement_card(name, date, description, image, link_button, link):
    if link_button == "":
        link_button = "Learn More"

    if link == "":
        link = "#"
    return f'''
        <div class="col-md-6">
          <div class="row g-0 border rounded overflow-hidden flex-md-row mb-2 shadow-sm h-md-250 position-relative sase-green">
            <div class="col p-4 d-flex flex-column position-static">
              <h3 class="mb-0">{name}</h3>
              <div class="mb-1 text-body-secondary">{date}</div>
              <p class="card-text mb-auto">{description}</p>
              <a href="{link}" target="_blank" class="btn btn-outline-light btn-lg my-2 rounded-0">{link_button}</a>
            </div>
            <div class="col-auto d-none d-lg-block">
              <img class="announcement-pic" src="images/Announcements/{image}" alt="Announcement Image" class="w-100">
            </div>
          </div>
        </div>''' + "\n"

def generate_carousel_item(image_name, is_active=False):
    # Remove file extension and replace underscores with spaces
    caption = image_name.rsplit('.', 1)[0]
    
    return f'''        <div class="carousel-item{' active' if is_active else ''}">
            <img src="images/Carousel/{image_name}" class="d-block w-100" alt="{caption}">
            <div class="carousel-caption d-none d-md-block">
              <div class="container-fluid bg-custom">
                <h5>{caption}</h5>
              </div>
            </div>
        </div>'''

def generate_carousel(image_list):
    carousel_html = '''    <div id="myCarousel" class="carousel slide mb-6" data-bs-ride="carousel">  
      <div class="carousel-inner">
'''
    
    # Generate carousel items
    for i, image in enumerate(image_list):
        carousel_html += generate_carousel_item(image, is_active=(i==0))
            
    # Add carousel controls
    carousel_html += '''      </div>
      <button class="carousel-control-prev" type="button" data-bs-target="#myCarousel" data-bs-slide="prev">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Previous</span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#myCarousel" data-bs-slide="next">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Next</span>
      </button>
    </div>'''
    
    return carousel_html

def generate_event_preview(name, date, description):
    return f'''            <div class="col-md-4 px-4">
              <h2 class="text-center mt-3">{name}</h2>
              <p class="text-center fs-5">{date}</p>
              <p class="py-3">{description}</p>
              <a href="pages_py/calender.html" class="btn sase-blue text-white" tabindex="-1" role="button" aria-disabled="false">Learn more</a>
            </div>'''
#______________________________________________________________________________
#gallery content generator

def update_gallery_content():
    # Read the meetTeam.html file
    with open('pages_py/gallery.html', 'r') as file:
        content = file.read()

    # Find the Eboard comment boundaries
    split_point = content.find("<!--Events-->")
    if split_point == -1:
        print("Could not find <!--Events--> comment marker")
        return
        
    # Get header content
    header_content = content[:split_point + len("<!--Events-->")] + "\n"

    footer_idx = content.find("<!--End of Events-->")
    if footer_idx == -1:
        print("Could not find end of events comment marker")
        return
    footer_content = "\n" + content[footer_idx:]

    # Read events from CSV into pandas dataframe
    # Read events from CSV and convert dates to datetime
    gallery_events_df = pd.read_csv("../CSV_info/GalleryEvents.csv")
    gallery_events_df['Date'] = pd.to_datetime(gallery_events_df['Date'])
    
    # Sort events by date descending (most recent first)
    gallery_events_df = gallery_events_df.sort_values('Date', ascending=False)
    
    # Initialize empty string to store all row HTML
    gallery_rows = ""
    
    # Group events by academic year and season
    for year in gallery_events_df['Date'].dt.year.unique():
        
        # Get events for Autumn semester (Aug-Dec)
        autumn_mask = (gallery_events_df['Date'].dt.year == year) & \
                     (gallery_events_df['Date'].dt.month.between(8, 12))
        autumn_events = gallery_events_df[autumn_mask]
        
        if not autumn_events.empty:
            gallery_rows += f'''    <div class="container"></div>
      <div class="break"></div>
      <h1 class="fw-bold text-center sase-blue-text">Autumn {year}</h1>
      <div class="break"></div>
    </div>\n'''
            
            for start_idx in range(0, len(autumn_events), 3):
                gallery_rows += generate_gallery_row(autumn_events, start_idx)
        
        # Get events for Spring semester (Jan-May)
        spring_mask = (gallery_events_df['Date'].dt.year == year) & \
                     (gallery_events_df['Date'].dt.month.between(1, 5))
        spring_events = gallery_events_df[spring_mask]
        
        if not spring_events.empty:
            gallery_rows += f'''    <div class="container"></div>
      <div class="break"></div>
      <h1 class="fw-bold text-center sase-blue-text">Spring {year}</h1>
      <div class="break"></div>
    </div>\n'''
            
            for start_idx in range(0, len(spring_events), 3):
                gallery_rows += generate_gallery_row(spring_events, start_idx)

    # Write the updated content to the gallery.html file
    with open('pages_py/gallery.html', 'w') as file:
        file.write(header_content)
        file.write(gallery_rows)
        file.write(footer_content)

def generate_gallery_row(events_df, start_idx):
    """Generate a row of up to 3 event cards from the events dataframe starting at the given index"""
    row_html = '''    <div class="row mb-3 mx-3">\n'''
    
    # Get up to 3 events for this row
    row_events = events_df.iloc[start_idx:start_idx+3]
    
    for i, (_, event) in enumerate(row_events.iterrows()):
        event_num = start_idx + i + 1
        
        # Get list of images for this event's carousel
        event_folder = f"images/event_post/{event['Name']}"
        image_files = []
        if os.path.exists(event_folder):
            image_files = [f for f in os.listdir(event_folder) if f.endswith(('.jpg','.png','.jpeg'))]
        
        # If no images found, use SASE logo
        if not image_files:
            image_files = ['sase_logo.png']
            event_folder = '../images'
            
        card_html = f'''      <div class="col-sm-4 themed-grid-col">
        <div class="card">
          <div id="event{event_num}Carousel" class="carousel slide" data-bs-ride="carousel" data-bs-interval="5000">
            <div class="carousel-inner">'''
            
        # Add carousel items
        for j, image in enumerate(image_files):
            card_html += f'''
              <div class="carousel-item{' active' if j==0 else ''}">
                <img class="d-block w-100 carousel-image" src="{event_folder}/{image}" alt="">
              </div>'''
                
        # Add carousel controls
        card_html += f'''
            </div>
            <button class="carousel-control-prev" type="button" data-bs-target="#event{event_num}Carousel" data-bs-slide="prev">
              <span class="carousel-control-prev-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#event{event_num}Carousel" data-bs-slide="next">
              <span class="carousel-control-next-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Next</span>
            </button>
          </div>
          <div class="card-body">
            <h5 class="card-title">{event['Name']}</h5>
            <p class="text-secondary mb-2">{event['Date'].strftime('%B %d, %Y')}</p>
            <p class="card-text">{event['Description']}</p>
          </div>
        </div>
      </div>'''
        
        row_html += card_html
        
    row_html += "    </div>\n"
    return row_html

#______________________________________________________________________________
#main
update_calendar_content()
update_meetTeam_content()
update_gallery_content()
update_index_content()


