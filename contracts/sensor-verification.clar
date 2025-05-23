;; Sensor Verification Contract
;; Validates air monitoring devices

(define-data-var admin principal tx-sender)

;; Map to store verified sensors
(define-map verified-sensors
  { sensor-id: (string-utf8 36) }
  {
    owner: principal,
    location: (string-utf8 100),
    sensor-type: (string-utf8 50),
    is-active: bool,
    last-verified: uint
  }
)

;; Public function to register a new sensor
(define-public (register-sensor
                (sensor-id (string-utf8 36))
                (location (string-utf8 100))
                (sensor-type (string-utf8 50)))
  (let ((current-time block-height))
    (if (is-eq tx-sender (var-get admin))
        (ok (map-set verified-sensors
                     { sensor-id: sensor-id }
                     {
                       owner: tx-sender,
                       location: location,
                       sensor-type: sensor-type,
                       is-active: true,
                       last-verified: current-time
                     }))
        (err u403))))

;; Public function to verify a sensor
(define-public (verify-sensor (sensor-id (string-utf8 36)))
  (let ((current-time block-height)
        (sensor-data (unwrap! (map-get? verified-sensors { sensor-id: sensor-id }) (err u404))))
    (if (is-eq tx-sender (var-get admin))
        (ok (map-set verified-sensors
                     { sensor-id: sensor-id }
                     (merge sensor-data { last-verified: current-time })))
        (err u403))))

;; Public function to deactivate a sensor
(define-public (deactivate-sensor (sensor-id (string-utf8 36)))
  (let ((sensor-data (unwrap! (map-get? verified-sensors { sensor-id: sensor-id }) (err u404))))
    (if (is-eq tx-sender (var-get admin))
        (ok (map-set verified-sensors
                     { sensor-id: sensor-id }
                     (merge sensor-data { is-active: false })))
        (err u403))))

;; Read-only function to check if a sensor is verified
(define-read-only (is-sensor-verified (sensor-id (string-utf8 36)))
  (match (map-get? verified-sensors { sensor-id: sensor-id })
    sensor-data (and (get is-active sensor-data)
                     (< (- block-height (get last-verified sensor-data)) u10000))
    false))

;; Read-only function to get sensor details
(define-read-only (get-sensor-details (sensor-id (string-utf8 36)))
  (map-get? verified-sensors { sensor-id: sensor-id }))

;; Function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (ok (var-set admin new-admin))))
