### 2. Comment ça fonctionne avec votre application ?
- Connexion : Vous pouvez connecter l'ESP32 à l'application soit via le bouton Bluetooth BLE , soit via WebSerial (USB) . Les deux sont gérés en même temps par ce code.
- Moteur : J'ai utilisé la logique standard d'un pont en H (ex: L298N ou L293D ).
  - La broche 25 (ENA) gère la vitesse en envoyant un signal PWM.
  - Les broches 26 et 27 (IN1 / IN2) gèrent le sens de rotation (Horaire / Anti-horaire).
- LED : La broche 2 allume une LED. Dans ce code, la LED s'allume automatiquement lorsque le moteur tourne , et s'éteint lorsqu'il s'arrête (lorsque l'application envoie START ou STOP ).
- Sécurité : Si le Bluetooth se déconnecte, l'ESP32 coupe automatiquement le moteur pour éviter que le plateau ne tourne indéfiniment.
Note : Si vous utilisez un bandeau LED type "NeoPixel/WS2812B" au lieu d'une simple LED/Mosfet, faites-le moi savoir, je pourrai modifier la fonction LED pour y intégrer la librairie FastLED !