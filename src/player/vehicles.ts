import * as THREE from 'three';
import { VEHICLES, ACCENT_COLOR } from '../config';

/** Create a simple 3D model for each vehicle type */
export function createVehicleModel(vehicleIndex: number): THREE.Group {
  const vehicle = VEHICLES[vehicleIndex];
  const group = new THREE.Group();
  group.name = vehicle.id;

  switch (vehicle.id) {
    case 'runner': {
      // Simple humanoid — capsule body + sphere head
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.3, 0.8, 4, 8),
        new THREE.MeshLambertMaterial({ color: 0x00FFC8 }),
      );
      body.position.y = 0.7;
      group.add(body);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0x00DDaa }),
      );
      head.position.y = 1.4;
      group.add(head);
      break;
    }

    case 'scooter': {
      // Flat board + handle + rider
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.1, 1.2),
        new THREE.MeshLambertMaterial({ color: 0x444466 }),
      );
      board.position.y = 0.15;
      group.add(board);

      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6),
        new THREE.MeshLambertMaterial({ color: 0x888888 }),
      );
      handle.position.set(0, 0.55, 0.4);
      group.add(handle);

      const rider = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.25, 0.6, 4, 8),
        new THREE.MeshLambertMaterial({ color: ACCENT_COLOR }),
      );
      rider.position.y = 0.8;
      group.add(rider);
      break;
    }

    case 'bird': {
      // Eagle — ellipsoid body + wings
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0x886633 }),
      );
      body.scale.set(1, 0.6, 1.5);
      group.add(body);

      const wingGeo = new THREE.PlaneGeometry(2.5, 0.8);
      const wingMat = new THREE.MeshLambertMaterial({ color: 0x664422, side: THREE.DoubleSide });
      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.position.set(-1.2, 0.1, 0);
      leftWing.rotation.z = 0.2;
      leftWing.name = 'wing-left';
      group.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeo, wingMat);
      rightWing.position.set(1.2, 0.1, 0);
      rightWing.rotation.z = -0.2;
      rightWing.name = 'wing-right';
      group.add(rightWing);
      break;
    }

    case 'milo': {
      // Cute brontosaurus
      const torso = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0x66aa44 }),
      );
      torso.scale.set(1, 0.7, 1.3);
      torso.position.y = 0.8;
      group.add(torso);

      const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 1.2, 6),
        new THREE.MeshLambertMaterial({ color: 0x66aa44 }),
      );
      neck.position.set(0, 1.5, 0.6);
      neck.rotation.x = -0.5;
      group.add(neck);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0x77bb55 }),
      );
      head.position.set(0, 2.0, 1.0);
      group.add(head);

      // Legs
      const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 6);
      const legMat = new THREE.MeshLambertMaterial({ color: 0x558833 });
      for (const [lx, lz] of [[-0.35, -0.4], [0.35, -0.4], [-0.35, 0.4], [0.35, 0.4]]) {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, 0.3, lz);
        group.add(leg);
      }
      break;
    }

    case 'rocket': {
      // Rocket cylinder + cone + fins
      const bodyR = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.35, 2, 8),
        new THREE.MeshLambertMaterial({ color: 0xcccccc }),
      );
      bodyR.position.y = 1;
      group.add(bodyR);

      const nose = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 0.6, 8),
        new THREE.MeshLambertMaterial({ color: 0xff4444 }),
      );
      nose.position.y = 2.3;
      group.add(nose);

      // Flame
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.8, 6),
        new THREE.MeshBasicMaterial({ color: 0xff8800 }),
      );
      flame.position.y = -0.4;
      flame.rotation.x = Math.PI;
      flame.name = 'flame';
      group.add(flame);
      break;
    }
  }

  return group;
}
