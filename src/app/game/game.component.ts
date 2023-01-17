

import { AfterViewInit, Component, ElementRef, Input, OnInit } from '@angular/core';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import * as io from "socket.io-client";
import { Router } from '@angular/router';
import { UserService } from '../_services/user.service';
import { StorageService } from '../_services/storage.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})

export class GameComponent implements AfterViewInit {

  username?: string;
  isLoggedIn = false;
  audiohit = new Audio();
  audiomiss = new Audio();
  
  constructor(
    private router: Router,
    private userService: UserService,
    private storageService: StorageService) { 

    this.audiohit.src = "assets/hit.mp3";
    this.audiohit.load();
    this.audiomiss.src = "assets/miss.mp3";
    this.audiomiss.load();
    }


  ngOnInit(): void {
    this.isLoggedIn = this.storageService.isLoggedIn();
    if (this.isLoggedIn) {
      const user = this.storageService.getUser();
      this.username = user.username;
      console.log(this.username)
    } else {
      window.location.replace('http://localhost:8081');
    }
  }


  onGameOver(state: string): void {
    const user = this.storageService.getUser();
    this.username = user.username;
    this.userService.insertScore(this.username!, state).subscribe({
      next: data => {
        console.log("Game state saved");
      },
      error: err => {
        console.log(err);
      }
    });
  }


  ngAfterViewInit() {
    const userGrid = document.querySelector('.grid-user')
    const computerGrid = document.querySelector('.grid-computer')
    const displayGrid = document.querySelector('.grid-display')
    const ships = document.querySelectorAll('.ship')
    const destroyer = document.querySelector('.destroyer-container')
    const submarine = document.querySelector('.submarine-container')
    const cruiser = document.querySelector('.cruiser-container')
    const battleship = document.querySelector('.battleship-container')
    const carrier = document.querySelector('.carrier-container')
    const startButton = <HTMLElement>document.querySelector('#start')
    const rotateButton = <HTMLElement>document.querySelector('#rotate')
    const turnDisplay = document.querySelector('#whose-go')
    const infoDisplay = document.querySelector('#info')
    //const multiPlayerButton = document.querySelector('#multiPlayerButton')
    const userSquares: any[] = []
    const computerSquares: any[] = []
    let isHorizontal = true
    let isGameOver = false
    let isYouWin = false
    let currentPlayer = 'user'
    const width = 10
    let gameMode = ""
    let playerNum = 0
    let ready = false
    let enemyReady = false
    let allShipsPlaced = false
    let shotFired = -1

    // Select Player Mode
    //multiPlayerButton!.addEventListener('click', startMultiPlayer)
    // Multiplayer     

    function startMultiPlayer() {
      const socket = io.connect('http://localhost:3000');
      if (history.state.roomCreate != null) {
        socket.emit('create', history.state.roomCreate)
      } else {
        socket.emit('join', history.state.roomJoin)
      }


      // Get your player number
      socket.on('player-number', num => {
        if (num === -1) {
          infoDisplay!.innerHTML = "Sorry, the server is full"
        } else {
          playerNum = parseInt(num)
          if (playerNum === 1) currentPlayer = "enemy"
          console.log(playerNum)
          // Get other player status
          socket.emit('check-players')
        }
      })


      // Another player has connected or disconnected
      socket.on('player-connection', num => {
        console.log(`Player number ${num} has connected or disconnected`)
        playerConnectedOrDisconnected(num)
      })


      // On enemy ready
      socket.on('enemy-ready', num => {
        enemyReady = true
        playerReady(num)
        if (ready) playGameMulti(socket)
      })

      // Check player status
      socket.on('check-players', players => {
        players.forEach((p: { connected: any; ready: any; }, i: string) => {
          if (p.connected) playerConnectedOrDisconnected(i)
          if (p.ready) {
            playerReady(i)
            //if(parseInt(i) !== playerReady(i)) enemyReady = true
          }
        })
      })

      // On Timeout
      socket.on('timeout', () => {
        infoDisplay!.innerHTML = 'You have reached the 10 minute limit'
      })

      // Ready button click
      startButton!.addEventListener('click', () => {
        if (allShipsPlaced) playGameMulti(socket)
        else infoDisplay!.innerHTML = "Please place all ships"
      })

      // Setup event listeners for firing
      computerSquares.forEach(square => {
        square.addEventListener('click', () => {
          if (currentPlayer === 'user' && ready && enemyReady) {
            shotFired = square.dataset.id
            socket.emit('fire', shotFired)
          }
        })
      })

      // On Fire Received
      socket.on('fire', id => {
        enemyGo(id)
        const square = userSquares[id]
        socket.emit('fire-reply', square.classList)
        playGameMulti(socket)
      })

      // On Fire Reply Received
      socket.on('fire-reply', classList => {
        revealSquare(classList)
        playGameMulti(socket)
      })


      function playerConnectedOrDisconnected(num: string) {
        let player = `.p${parseInt(num) + 1}`
        document.querySelector(`${player} .connected`)!.classList.toggle('active')
        //if(parseInt(num) === playerNum) document.querySelector(player)!.style.fontWeight = 'bold'
      }
    }

    //Create Board
    function createBoard(grid: Element | null, squares: any[]) {
      for (let i = 0; i < width * width; i++) {
        const square = document.createElement('div')
        square.dataset['id'] = i.toString()
        grid!.appendChild(square)
        squares.push(square)
      }
    }
    createBoard(userGrid, userSquares)
    createBoard(computerGrid, computerSquares)

    //Ships
    const shipArray = [
      {
        name: 'destroyer',
        directions: [
          [0, 1],
          [0, width]
        ]
      },
      {
        name: 'submarine',
        directions: [
          [0, 1, 2],
          [0, width, width * 2]
        ]
      },
      {
        name: 'cruiser',
        directions: [
          [0, 1, 2],
          [0, width, width * 2]
        ]
      },
      {
        name: 'battleship',
        directions: [
          [0, 1, 2, 3],
          [0, width, width * 2, width * 3]
        ]
      },
      {
        name: 'carrier',
        directions: [
          [0, 1, 2, 3, 4],
          [0, width, width * 2, width * 3, width * 4]
        ]
      },
    ]



    //Rotate the ships
    function rotate() {
      if (isHorizontal) {
        destroyer!.classList.toggle('destroyer-container-vertical')
        submarine!.classList.toggle('submarine-container-vertical')
        cruiser!.classList.toggle('cruiser-container-vertical')
        battleship!.classList.toggle('battleship-container-vertical')
        carrier!.classList.toggle('carrier-container-vertical')
        isHorizontal = false
        console.log(isHorizontal)
        return
      }
      if (!isHorizontal) {
        destroyer!.classList.toggle('destroyer-container-vertical')
        submarine!.classList.toggle('submarine-container-vertical')
        cruiser!.classList.toggle('cruiser-container-vertical')
        battleship!.classList.toggle('battleship-container-vertical')
        carrier!.classList.toggle('carrier-container-vertical')
        isHorizontal = true
        console.log(isHorizontal)
        return
      }
    }

    rotateButton!.addEventListener('click', rotate)

    //move around user shipships
    ships.forEach(ship => ship.addEventListener('dragstart', dragStart))
    userSquares.forEach(square => square.addEventListener('dragstart', dragStart))
    userSquares.forEach(square => square.addEventListener('dragover', dragOver))
    userSquares.forEach(square => square.addEventListener('dragenter', dragEnter))
    userSquares.forEach(square => square.addEventListener('dragleave', dragLeave))
    userSquares.forEach(square => square.addEventListener('drop', dragDrop))
    userSquares.forEach(square => square.addEventListener('dragend', dragEnd))

    let selectedShipNameWithIndex: string
    let draggedShip: any
    let draggedShipLength: number

    ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
      let target = e.target as HTMLDivElement;
      selectedShipNameWithIndex = target.id
      console.log(selectedShipNameWithIndex)
    }))

    function dragStart(this: any) {
      draggedShip = this
      draggedShipLength = this.childNodes.length
      console.log(draggedShip)
    }

    function dragOver(e: { preventDefault: () => void; }) {
      e.preventDefault()
    }

    function dragEnter(e: { preventDefault: () => void; }) {
      e.preventDefault()
    }

    function dragLeave() {
      console.log('drag leave')
    }

    function dragDrop(this: any) {
      let shipNameWithLastId = draggedShip.lastChild.id
      let shipClass = shipNameWithLastId.slice(0, -2)
      console.log(shipClass)
      let lastShipIndex = parseInt(shipNameWithLastId.substr(-1))
      let shipLastId = lastShipIndex + parseInt(this.dataset.id)
      console.log(shipLastId)
      const notAllowedHorizontal = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 1, 11, 21, 31, 41, 51, 61, 71, 81, 91, 2, 22, 32, 42, 52, 62, 72, 82, 92, 3, 13, 23, 33, 43, 53, 63, 73, 83, 93]
      const notAllowedVertical = [99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78, 77, 76, 75, 74, 73, 72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60]

      let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lastShipIndex)
      let newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex)

      let selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1))

      shipLastId = shipLastId - selectedShipIndex
      console.log(shipLastId)

      if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)) {
        for (let i = 0; i < draggedShipLength; i++) {
          let directionClass
          if (i === 0) directionClass = 'start'
          if (i === draggedShipLength - 1) directionClass = 'end'
          userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', 'horizontal', directionClass, shipClass)
        }
        //As long as the index of the ship you are dragging is not in the newNotAllowedVertical array! This means that sometimes if you drag the ship by its
        //index-1 , index-2 and so on, the ship will rebound back to the displayGrid.
      } else if (!isHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
        for (let i = 0; i < draggedShipLength; i++) {
          let directionClass
          if (i === 0) directionClass = 'start'
          if (i === draggedShipLength - 1) directionClass = 'end'
          userSquares[parseInt(this.dataset.id) - selectedShipIndex + width * i].classList.add('taken', 'vertical', directionClass, shipClass)
        }
      } else return

      displayGrid!.removeChild(draggedShip)
      if (!displayGrid!.querySelector('.ship')) allShipsPlaced = true
    }

    function dragEnd() {
      console.log('dragend')
    }

    //Game Logic



    // Game Logic for MultiPlayer
    function playGameMulti(socket: io.Socket<DefaultEventsMap, DefaultEventsMap>) {
      startButton!.style.display = 'none'
      rotateButton!.style.display = 'none'
      if (isGameOver) return
      if (!ready) {
        socket.emit('player-ready')
        ready = true
        playerReady(playerNum.toString())
      }

      if (enemyReady) {
        if (currentPlayer === 'user') {
          turnDisplay!.innerHTML = 'Your Go'
        }
        if (currentPlayer === 'enemy') {
          turnDisplay!.innerHTML = "Enemy's Go"
        }
      }
    }

    function playerReady(num: any) {
      let player = `.p${parseInt(num) + 1}`
      document.querySelector(`${player} .ready`)!.classList.toggle('active')
    }



    let destroyerCount = 0
    let submarineCount = 0
    let cruiserCount = 0
    let battleshipCount = 0
    let carrierCount = 0

    const revealSquare = (classList: { [s: string]: unknown; } | ArrayLike<unknown>) => {
      const enemySquare = computerGrid!.querySelector(`div[data-id='${shotFired}']`)
      const obj = Object.values(classList)
      if (!enemySquare!.classList.contains('boom') && currentPlayer === 'user' && !isGameOver) {
        if (obj.includes('destroyer')) destroyerCount++
        if (obj.includes('submarine')) submarineCount++
        if (obj.includes('cruiser')) cruiserCount++
        if (obj.includes('battleship')) battleshipCount++
        if (obj.includes('carrier')) carrierCount++
      }
      if (obj.includes('taken')) {
        enemySquare!.classList.add('boom')
        this.audiohit.play();
      } else {
        enemySquare!.classList.add('miss')
        this.audiomiss.play();
      }
      checkForWins()
      currentPlayer = 'enemy'
    }


    let cpuDestroyerCount = 0
    let cpuSubmarineCount = 0
    let cpuCruiserCount = 0
    let cpuBattleshipCount = 0
    let cpuCarrierCount = 0

    const enemyGo = (square: number) => {
      if (!userSquares[square].classList.contains('boom')) {
        const hit = userSquares[square].classList.contains('taken')
        userSquares[square].classList.add(hit ? 'boom' : 'miss')
        if (userSquares[square].classList.contains('destroyer')) cpuDestroyerCount++
        if (userSquares[square].classList.contains('submarine')) cpuSubmarineCount++
        if (userSquares[square].classList.contains('cruiser')) cpuCruiserCount++
        if (userSquares[square].classList.contains('battleship')) cpuBattleshipCount++
        if (userSquares[square].classList.contains('carrier')) cpuCarrierCount++
        checkForWins()
     
      }
      currentPlayer = 'user'
      turnDisplay!.innerHTML = 'Your Go'
    }

    function checkForWins() {
      let enemy = 'enemy'
      if (gameMode === 'multiPlayer') enemy = 'enemy'
      if (destroyerCount === 2) {
        infoDisplay!.innerHTML = `You sunk the ${enemy}'s destroyer`
        destroyerCount = 10
      }
      if (submarineCount === 3) {
        infoDisplay!.innerHTML = `You sunk the ${enemy}'s submarine`
        submarineCount = 10
      }
      if (cruiserCount === 3) {
        infoDisplay!.innerHTML = `You sunk the ${enemy}'s cruiser`
        cruiserCount = 10
      }
      if (battleshipCount === 4) {
        infoDisplay!.innerHTML = `You sunk the ${enemy}'s battleship`
        battleshipCount = 10
      }
      if (carrierCount === 5) {
        infoDisplay!.innerHTML = `You sunk the ${enemy}'s carrier`
        carrierCount = 10
      }
      if (cpuDestroyerCount === 2) {
        infoDisplay!.innerHTML = `${enemy} sunk your destroyer`
        cpuDestroyerCount = 10
      }
      if (cpuSubmarineCount === 3) {
        infoDisplay!.innerHTML = `${enemy} sunk your submarine`
        cpuSubmarineCount = 10
      }
      if (cpuCruiserCount === 3) {
        infoDisplay!.innerHTML = `${enemy} sunk your cruiser`
        cpuCruiserCount = 10
      }
      if (cpuBattleshipCount === 4) {
        infoDisplay!.innerHTML = `${enemy} sunk your battleship`
        cpuBattleshipCount = 10
      }
      if (cpuCarrierCount === 5) {
        infoDisplay!.innerHTML = `${enemy} sunk your carrier`
        cpuCarrierCount = 10
      }

      if ((destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount) === 50) {
        infoDisplay!.innerHTML = "YOU WON"
        gameOver("YOU WON")

      }
      if ((cpuDestroyerCount + cpuSubmarineCount + cpuCruiserCount + cpuBattleshipCount + cpuCarrierCount) === 50) {
        infoDisplay!.innerHTML = `${enemy.toUpperCase()} WON`
        isYouWin = false
        gameOver("YOU LOSE")
      }
    }

    const gameOver = (state: string) => {
      isGameOver = true
      this.onGameOver(state);
    }

    startMultiPlayer();
  }





}

