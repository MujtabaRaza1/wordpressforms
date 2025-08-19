document.addEventListener('DOMContentLoaded', function() {
    // Vehicle data with images, passengers, and suitcases
    const vehicleData = {
        'Luxury Sedan (3 passengers)': {  // Updated to match CF7 option values
            passengers: 3,
            suitcases: 3,
            image: 'https://www.royalcarriages.com/wp-content/uploads/2025/08/sedan-1.jpg'
        },
        'Mercedes S Class Sedan (3 passengers)': {
            passengers: 3,
            suitcases: 3,
            image: 'https://www.royalcarriages.com/wp-content/uploads/2025/08/S-class-2.png'
        },
        'Luxury Suburban (6 passengers)': {
            passengers: 6,
            suitcases: 6,
            image: 'https://www.royalcarriages.com/wp-content/uploads/2025/08/luxury-suburban-4.png'
        },
        'Luxury Escalade (6 passengers)': {
            passengers: 6,
            suitcases: 6,
            image: 'https://www.royalcarriages.com/wp-content/uploads/2025/08/escalade-5.png'
        },
        'Stretch Limousine (10 passengers)': {
            passengers: 10,
            suitcases: 4,
            image: 'https://www.royalcarriages.com/wp-content/uploads/2025/08/stretch-white-limousine-6.jpg'
        },
        'Passenger Van (10 passengers)': {
            passengers: 10,
            suitcases: 10,
            image: 'https://www.royalcarriages.com/wp-content/uploads/2025/08/passenger-vans-9.jpg'
        },
        'Stretch Hummer Limousine (18 passengers)': {
            passengers: 18,
            suitcases: 6,
            image: 'https://www.royalcarriages.com/wp-content/uploads/2025/08/stretch-hummer-limousine-7.jpg'
        },
        'Stretch Escalade Limousine (18 passengers)': {
            passengers: 18,
            suitcases: 8,
            image: 'https://www.royalcarriages.com/wp-content/uploads/2025/08/stretch-escalade-limousine-8.jpeg'
        },
        'Limo Bus 20 passengers (20 passengers)': {
            passengers: 20,
            suitcases: 10,
            image: 'https://www.royalcarriages.com/wp-content/uploads/2025/08/20-passenger-limo-bus-11.jpg'
        },
        'Shuttle Bus 30 Passengers (25 passengers)': {
            passengers: 25,
            suitcases: 15,
            image: 'https://www.royalcarriages.com/wp-content/uploads/2025/08/shuttle-buses-12.jpg'
        },
        'Limo Bus 30 Passengers (30 passengers)': {
            passengers: 30,
            suitcases: 20,
            image: 'https://www.royalcarriages.com/wp-content/uploads/2025/08/30-Pass-Limo-Bus.png'
        },
        'Luxury Mercedes Sprinter Van (14 passengers)': {
            passengers: 14,
            suitcases: 10,
            image: 'https://www.royalcarriages.com/wp-content/uploads/2025/08/mercedes-sprinter-10.jpg'
        },
        'Luxury Executive Shuttle Bus (40 passengers)': {
            passengers: 40,
            suitcases: 20,
            image: 'https://www.royalcarriages.com/wp-content/uploads/2025/08/Executive-Shuttle-Bus-40-Pass.png'
        },
        'Charter Bus / Motor Coach (55 passengers)': {
            passengers: 55,
            suitcases: 40,
            image: 'https://www.royalcarriages.com/wp-content/uploads/2025/08/charter-bus-motor-coach-16.jpeg'
        }
    };

    // Wait for Contact Form 7 to fully render the form
    function waitForCF7Elements(callback, maxAttempts = 50) {
        let attempts = 0;
        
        function checkElements() {
            attempts++;
            
            // Check for CF7-generated elements
            const typeOfVehicleSelect = document.querySelector('select[name="type-of-vehicle"]');
            const passengerSelect = document.querySelector('select[name="number-of-passengers"]');
            const suitcaseSelect = document.querySelector('select[name="number-of-suitcases"]');
            const pickupDateInput = document.querySelector('input[name="pickup-date"]');
            
            if (typeOfVehicleSelect && passengerSelect && suitcaseSelect && pickupDateInput) {
                console.log('CF7 elements found, initializing scripts...');
                callback();
            } else if (attempts < maxAttempts) {
                setTimeout(checkElements, 100);
            } else {
                console.warn('CF7 elements not found after maximum attempts');
                // Try to run anyway in case some elements exist
                callback();
            }
        }
        
        checkElements();
    }

    // Initialize all functionality after CF7 elements are ready
    waitForCF7Elements(function() {
        initializeAllFeatures();
    });

    function initializeAllFeatures() {
        preloadVehicleImages();
        initializeGooglePlaces();
        initializeVehicleSelection();
        initializeDatePicker();
        initializeValidation();
    }

    // Preload all vehicle images for instant display
    function preloadVehicleImages() {
        console.log('Preloading vehicle images...');
        const imagePromises = [];
        
        Object.keys(vehicleData).forEach(vehicleName => {
            const img = new Image();
            const promise = new Promise((resolve, reject) => {
                img.onload = () => {
                    console.log(`Loaded: ${vehicleName}`);
                    resolve(vehicleName);
                };
                img.onerror = () => {
                    console.warn(`Failed to load: ${vehicleName}`);
                    reject(vehicleName);
                };
            });
            img.src = vehicleData[vehicleName].image;
            imagePromises.push(promise);
        });

        // Log when all images are loaded
        Promise.allSettled(imagePromises).then(results => {
            const loaded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            console.log(`Vehicle images preloaded: ${loaded} loaded, ${failed} failed`);
        });
    }

    // Google Places Autocomplete functionality (unchanged - uses preserved IDs)
    let pickupValidSelection = false;
    let dropoffValidSelection = false;
    
    function initializeGooglePlaces() {
        if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
            console.warn('Google Places API not available');
            return;
        }

        const service = new google.maps.places.AutocompleteService();
        const placesService = new google.maps.places.PlacesService(document.createElement('div'));
        
        function setupCustomAutocomplete(inputElement, fieldType) {
            if (!inputElement) return;
            
            let selectedPrediction = null;
            
            // Create dropdown container
            const dropdown = document.createElement('div');
            dropdown.className = 'custom-pac-container';
            dropdown.style.cssText = `
                position: absolute;
                z-index: 9999;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                max-height: 300px;
                overflow-y: auto;
                display: none;
                width: 100%;
                font-family: Arial, sans-serif;
            `;
            inputElement.parentNode.style.position = 'relative';
            inputElement.parentNode.appendChild(dropdown);
            
            // Input event handler (rest of Google Places logic - unchanged)
            let debounceTimer;
            inputElement.addEventListener('input', function() {
                clearTimeout(debounceTimer);
                const query = this.value.trim();
                
                // Reset selection flag when user types
                if (fieldType === 'pickup') {
                    pickupValidSelection = false;
                } else {
                    dropoffValidSelection = false;
                }
                
                if (query.length < 1) {
                    dropdown.style.display = 'none';
                    return;
                }
                
                debounceTimer = setTimeout(() => {
                    service.getPlacePredictions({
                        input: query,
                        types: ['address']
                    }, (predictions, status) => {
                        dropdown.innerHTML = '';
                        
                        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                            dropdown.style.display = 'block';
                            dropdown.innerHTML = '<div style="padding: 16px; color: #666; text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading addresses...</div>';
                            
                            let processedCount = 0;
                            const totalPredictions = predictions.slice(0, 5).length;
                            const items = [];
                            
                            predictions.slice(0, 5).forEach((prediction, index) => {
                                placesService.getDetails({
                                    placeId: prediction.place_id,
                                    fields: ['address_components', 'formatted_address']
                                }, (place, detailStatus) => {
                                    processedCount++;
                                    
                                    if (detailStatus === google.maps.places.PlacesServiceStatus.OK) {
                                        // Create address display item
                                        const item = document.createElement('div');
                                        item.className = 'custom-pac-item';
                                        item.style.cssText = `
                                            padding: 12px 16px;
                                            border-bottom: 1px solid #f0f0f0;
                                            cursor: pointer;
                                            font-size: 14px;
                                            transition: background-color 0.2s ease;
                                        `;
                                        
                                        item.innerHTML = `<div style="font-weight: 600; color: #333;">${place.formatted_address}</div>`;
                                        
                                        // Click handler
                                        item.addEventListener('click', () => {
                                            inputElement.value = place.formatted_address;
                                            dropdown.style.display = 'none';
                                            if (fieldType === 'pickup') {
                                                pickupValidSelection = true;
                                            } else {
                                                dropoffValidSelection = true;
                                            }
                                        });
                                        
                                        // Hover effects
                                        item.addEventListener('mouseenter', () => {
                                            item.style.backgroundColor = '#f8f9fa';
                                        });
                                        item.addEventListener('mouseleave', () => {
                                            item.style.backgroundColor = 'white';
                                        });
                                        
                                        items.push({ index, item });
                                    }
                                    
                                    // Update dropdown when all predictions are processed
                                    if (processedCount === totalPredictions) {
                                        dropdown.innerHTML = '';
                                        
                                        if (items.length === 0) {
                                            dropdown.innerHTML = '<div style="padding: 16px; color: #666; text-align: center;">No addresses found</div>';
                                        } else {
                                            items.sort((a, b) => a.index - b.index);
                                            items.forEach(({ item }) => {
                                                dropdown.appendChild(item);
                                            });
                                        }
                                    }
                                });
                            });
                        } else {
                            dropdown.style.display = 'none';
                        }
                    });
                }, 100);
            });
            
            // Hide dropdown on blur
            inputElement.addEventListener('blur', function() {
                setTimeout(() => {
                    dropdown.style.display = 'none';
                }, 150);
            });
        }
        
        // Setup autocomplete for address fields (IDs preserved)
        setupCustomAutocomplete(document.getElementById('search_input'), 'pickup');
        setupCustomAutocomplete(document.getElementById('drop_input'), 'dropoff');
        
        console.log('Google Places Autocomplete initialized for CF7 form');
    }

    // Vehicle selection with CF7-compatible selectors
    function initializeVehicleSelection() {
        // Use CF7-generated select element
        const vehicleSelect = document.querySelector('select[name="type-of-vehicle"]');
        
        if (!vehicleSelect) {
            console.warn('Vehicle select element not found');
            return;
        }

        vehicleSelect.addEventListener('change', function() {
            const selectedVehicle = this.value;
            const vehicleImageDiv = document.getElementById('vehicleImage');
            const vehicleImg = document.getElementById('vehicleImg');
            const vehiclePassengers = document.getElementById('vehiclePassengers');
            
            if (selectedVehicle && vehicleData[selectedVehicle]) {
                const vehicle = vehicleData[selectedVehicle];
                
                // Show vehicle image and details
                if (vehicleImg) vehicleImg.src = vehicle.image;
                if (vehiclePassengers) vehiclePassengers.textContent = vehicle.passengers;
                if (vehicleImageDiv) vehicleImageDiv.style.display = 'block';
                
                // Update passenger and suitcase dropdowns
                updatePassengerOptions(vehicle.passengers);
                updateSuitcaseOptions(vehicle.suitcases);
            } else {
                // Hide vehicle display
                if (vehicleImageDiv) vehicleImageDiv.style.display = 'none';
                
                // Reset dropdowns to full range
                updatePassengerOptions(55);
                updateSuitcaseOptions(100);
            }
        });

        console.log('Vehicle selection system initialized for CF7 form');
    }

    // Update passenger options with CF7-compatible selector
    function updatePassengerOptions(maxPassengers) {
        const passengerSelect = document.querySelector('select[name="number-of-passengers"]');
        if (!passengerSelect) return;
        
        const currentValue = passengerSelect.value;
        
        // Clear existing options except first
        passengerSelect.innerHTML = '<option value="">Select Passengers</option>';
        
        // Add options up to max passengers
        for (let i = 1; i <= maxPassengers; i++) {
            const option = document.createElement('option');
            option.value = i.toString().padStart(2, '0');
            option.textContent = i.toString().padStart(2, '0');
            passengerSelect.appendChild(option);
        }
        
        // Restore previous value if still valid
        if (currentValue && parseInt(currentValue) <= maxPassengers) {
            passengerSelect.value = currentValue;
        }
    }

    // Update suitcase options with CF7-compatible selector
    function updateSuitcaseOptions(maxSuitcases) {
        const suitcaseSelect = document.querySelector('select[name="number-of-suitcases"]');
        if (!suitcaseSelect) return;
        
        const currentValue = suitcaseSelect.value;
        
        // Clear existing options except first
        suitcaseSelect.innerHTML = '<option value="">Select Suitcases</option>';
        
        // Add options up to max suitcases
        for (let i = 1; i <= maxSuitcases; i++) {
            const option = document.createElement('option');
            option.value = i.toString().padStart(2, '0');
            option.textContent = i.toString().padStart(2, '0');
            suitcaseSelect.appendChild(option);
        }
        
        // Restore previous value if still valid
        if (currentValue && parseInt(currentValue) <= maxSuitcases) {
            suitcaseSelect.value = currentValue;
        }
    }

    // Date picker initialization with CF7-compatible selector
    function initializeDatePicker() {
        const pickupDateInput = document.querySelector('input[name="pickup-date"]');
        
        if (!pickupDateInput || typeof AirDatepicker === 'undefined') {
            console.warn('Date picker elements or AirDatepicker not available');
            return;
        }

        const today = new Date();
        
        new AirDatepicker(pickupDateInput, {
            minDate: today,
            dateFormat: 'yyyy-MM-dd',
            autoClose: true,
            isMobile: false,
            toggleSelected: false,
            onSelect: function({date, formattedDate, datepicker}) {
                // Trigger validation when a date is selected
                if (typeof jQuery !== 'undefined') {
                    // Use jQuery to trigger validation immediately after date selection
                    jQuery(pickupDateInput).removeClass('field-required-highlight').addClass('field-valid');
                    // Hide any error messages
                    jQuery(pickupDateInput).siblings('.field-error-message').hide();
                }
            },
            locale: {
                days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                daysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
                months: ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'],
                monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                today: 'Today',
                clear: 'Clear',
                dateFormat: 'yyyy-MM-dd',
                timeFormat: 'HH:mm',
                firstDay: 0
            }
        });

        console.log('Date picker initialized for CF7 form');
    }

    // Form validation for CF7 forms
    function initializeValidation() {
        // Wait for jQuery if using CF7
        if (typeof jQuery !== 'undefined') {
            jQuery(document).ready(function($) {
                // CF7 form validation logic
                function validateRequiredField(field) {
                    var isRequired = field.hasClass('wpcf7-validates-as-required') || field.attr('aria-required') === 'true' || field.prop('required');
                    var isEmpty = false;
                    
                    if (field.is('select')) {
                        isEmpty = field.val() === '' || field.val() === null;
                    } else {
                        isEmpty = field.val().trim() === '';
                    }
                    
                    if (isRequired && isEmpty) {
                        field.addClass('field-required-highlight').removeClass('field-valid');
                        showErrorMessage(field, 'This field is required.');
                        return false;
                    } else {
                        field.removeClass('field-required-highlight');
                        hideErrorMessage(field);
                        if (!isEmpty) {
                            field.addClass('field-valid');
                        }
                        return true;
                    }
                }
                
                function showErrorMessage(field, message) {
                    var errorDiv = field.siblings('.field-error-message');
                    if (errorDiv.length === 0) {
                        errorDiv = $('<div class="field-error-message">' + message + '</div>');
                        field.parent().append(errorDiv);
                    } else {
                        errorDiv.text(message);
                    }
                    errorDiv.show();
                }
                
                function hideErrorMessage(field) {
                    field.siblings('.field-error-message').hide();
                }
                
                // Event listeners for CF7 form elements
                $('.wpcf7-form input, .wpcf7-form select, .wpcf7-form textarea').on('blur', function() {
                    validateRequiredField($(this));
                });
                
                $('.wpcf7-form input, .wpcf7-form select, .wpcf7-form textarea').on('focus', function() {
                    $(this).removeClass('field-required-highlight field-valid');
                    hideErrorMessage($(this));
                });
                
                console.log('CF7 form validation initialized');
            });
        }
    }
});

// Load Air Datepicker if not already loaded
if (typeof AirDatepicker === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/air-datepicker@3.5.3/air-datepicker.js';
    document.head.appendChild(script);
}